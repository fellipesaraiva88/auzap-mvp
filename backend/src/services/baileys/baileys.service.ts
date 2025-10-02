import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WASocket,
  proto,
  Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs/promises';
import QRCode from 'qrcode';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';

interface BaileysInstance {
  sock: WASocket;
  organizationId: string;
  instanceId: string;
  phoneNumber?: string;
}

export class BaileysService {
  private instances = new Map<string, BaileysInstance>();
  private sessionPath: string;

  constructor() {
    this.sessionPath = process.env.WHATSAPP_SESSION_PATH || './sessions';
  }

  /**
   * Inicializa uma instância WhatsApp com pairing code
   */
  async initializeInstance(
    organizationId: string,
    instanceId: string,
    phoneNumber?: string
  ): Promise<{ success: boolean; pairingCode?: string; qrCode?: string }> {
    try {
      const instanceKey = `${organizationId}_${instanceId}`;
      
      // Verifica se já existe
      if (this.instances.has(instanceKey)) {
        throw new Error('Instance already exists');
      }

      const sessionDir = path.join(this.sessionPath, instanceKey);
      await fs.mkdir(sessionDir, { recursive: true });

      // Auth state
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      // Fetch latest version
      const { version, isLatest } = await fetchLatestBaileysVersion();
      logger.info({ version, isLatest }, 'Using Baileys version');

      // Criar socket
      const sock = makeWASocket({
        version,
        logger: logger as any,
        printQRInTerminal: !phoneNumber,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger as any)
        },
        browser: Browsers.ubuntu('Chrome'),
        generateHighQualityLinkPreview: true
      });

      // Event handlers
      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !phoneNumber) {
          // Gerar QR code
          const qrCodeData = await QRCode.toDataURL(qr);
          await this.updateInstanceStatus(instanceId, 'qr_pending', qrCodeData);
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          logger.info({ shouldReconnect }, 'Connection closed');

          if (shouldReconnect) {
            await this.initializeInstance(organizationId, instanceId, phoneNumber);
          } else {
            await this.updateInstanceStatus(instanceId, 'disconnected');
            this.instances.delete(instanceKey);
          }
        } else if (connection === 'open') {
          logger.info('Connection opened successfully');
          const number = sock.user?.id.split(':')[0];
          await this.updateInstanceStatus(instanceId, 'connected', null, number);
        }
      });

      sock.ev.on('messages.upsert', async (msg) => {
        await this.handleIncomingMessage(organizationId, instanceId, msg);
      });

      // Guardar instância
      this.instances.set(instanceKey, {
        sock,
        organizationId,
        instanceId,
        phoneNumber
      });

      // Pairing code se tiver número
      let pairingCode: string | undefined;
      if (phoneNumber && !sock.authState.creds.registered) {
        pairingCode = await sock.requestPairingCode(phoneNumber);
        logger.info({ pairingCode }, 'Pairing code generated');
        await this.updateInstanceStatus(instanceId, 'connecting');
      }

      return {
        success: true,
        pairingCode,
        qrCode: undefined
      };
    } catch (error) {
      logger.error({ error }, 'Failed to initialize WhatsApp instance');
      throw error;
    }
  }

  /**
   * Envia mensagem de texto
   */
  async sendTextMessage(
    instanceId: string,
    to: string,
    message: string
  ): Promise<proto.WebMessageInfo> {
    const instance = this.getInstanceByInstanceId(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    const jid = this.formatJid(to);
    const sent = await instance.sock.sendMessage(jid, { text: message });
    return sent!;
  }

  /**
   * Envia imagem
   */
  async sendImageMessage(
    instanceId: string,
    to: string,
    imageBuffer: Buffer,
    caption?: string
  ): Promise<proto.WebMessageInfo> {
    const instance = this.getInstanceByInstanceId(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    const jid = this.formatJid(to);
    const sent = await instance.sock.sendMessage(jid, {
      image: imageBuffer,
      caption
    });
    return sent!;
  }

  /**
   * Envia áudio
   */
  async sendAudioMessage(
    instanceId: string,
    to: string,
    audioBuffer: Buffer,
    ptt: boolean = true
  ): Promise<proto.WebMessageInfo> {
    const instance = this.getInstanceByInstanceId(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    const jid = this.formatJid(to);
    const sent = await instance.sock.sendMessage(jid, {
      audio: audioBuffer,
      mimetype: 'audio/mp4',
      ptt
    });
    return sent!;
  }

  /**
   * Envia botões
   */
  async sendButtonMessage(
    instanceId: string,
    to: string,
    text: string,
    buttons: { id: string; text: string }[],
    footer?: string
  ): Promise<proto.WebMessageInfo> {
    const instance = this.getInstanceByInstanceId(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    const jid = this.formatJid(to);
    const sent = await instance.sock.sendMessage(jid, {
      text,
      footer,
      buttons: buttons.map(btn => ({
        buttonId: btn.id,
        buttonText: { displayText: btn.text },
        type: 1
      })),
      headerType: 1
    });
    return sent!;
  }

  /**
   * Envia lista
   */
  async sendListMessage(
    instanceId: string,
    to: string,
    text: string,
    buttonText: string,
    sections: { title: string; rows: { id: string; title: string; description?: string }[] }[]
  ): Promise<proto.WebMessageInfo> {
    const instance = this.getInstanceByInstanceId(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    const jid = this.formatJid(to);
    const sent = await instance.sock.sendMessage(jid, {
      text,
      buttonText,
      sections,
      listType: 1
    });
    return sent!;
  }

  /**
   * Verifica status da conexão
   */
  isConnected(instanceId: string): boolean {
    const instance = this.getInstanceByInstanceId(instanceId);
    return !!instance?.sock.user;
  }

  /**
   * Desconecta instância
   */
  async disconnect(instanceId: string): Promise<void> {
    const instance = this.getInstanceByInstanceId(instanceId);
    if (instance) {
      await instance.sock.logout();
      const key = `${instance.organizationId}_${instanceId}`;
      this.instances.delete(key);
      await this.updateInstanceStatus(instanceId, 'disconnected');
    }
  }

  /**
   * Lista todas as instâncias
   */
  listInstances(): string[] {
    return Array.from(this.instances.keys());
  }

  // Métodos privados

  private getInstanceByInstanceId(instanceId: string): BaileysInstance | undefined {
    for (const [key, instance] of this.instances.entries()) {
      if (instance.instanceId === instanceId) {
        return instance;
      }
    }
    return undefined;
  }

  private formatJid(phone: string): string {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Se já termina com @s.whatsapp.net, retorna
    if (phone.includes('@')) {
      return phone;
    }

    // Adiciona @s.whatsapp.net para números individuais
    return `${cleaned}@s.whatsapp.net`;
  }

  private async handleIncomingMessage(
    organizationId: string,
    instanceId: string,
    msg: { messages: proto.IWebMessageInfo[]; type: 'notify' | 'append' }
  ): Promise<void> {
    for (const message of msg.messages) {
      if (!message.message || message.key.fromMe) continue;

      const from = message.key.remoteJid!;
      const content = this.extractMessageContent(message);

      logger.info({
        organizationId,
        instanceId,
        from,
        content
      }, 'Incoming WhatsApp message');

      // Adicionar à fila de processamento
      const { messageQueue } = await import('../../config/redis.js');
      await messageQueue.add('process-message', {
        organizationId,
        instanceId,
        from,
        content,
        messageId: message.key.id,
        timestamp: message.messageTimestamp
      });
    }
  }

  private extractMessageContent(message: proto.IWebMessageInfo): string {
    const msg = message.message;
    if (!msg) return '';

    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption;
    if (msg.videoMessage?.caption) return msg.videoMessage.caption;
    if (msg.documentMessage?.caption) return msg.documentMessage.caption;

    return '[Media message]';
  }

  private async updateInstanceStatus(
    instanceId: string,
    status: 'disconnected' | 'connecting' | 'connected' | 'qr_pending',
    qrCode: string | null = null,
    phoneNumber?: string
  ): Promise<void> {
    await supabaseAdmin
      .from('whatsapp_instances')
      .update({
        status,
        qr_code: qrCode,
        phone_number: phoneNumber,
        last_connected_at: status === 'connected' ? new Date().toISOString() : undefined
      })
      .eq('id', instanceId);
  }
}

export const baileysService = new BaileysService();
