import makeWASocket, {
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  proto,
  Browsers
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { logger } from '../../config/logger.js';
import { messageQueue } from '../../queue/queue-manager.js';
import { sessionManager } from '../whatsapp/session-manager.js';
import { connectionHandler } from '../whatsapp/connection-handler.js';
import type {
  BaileysInstance,
  InitializeInstanceConfig,
  InitializeInstanceResult,
  WhatsAppConnectionStatus,
  SendMessageResult,
  TextMessage,
  MediaMessage,
  AudioMessage,
  InstanceHealth,
  IncomingMessageData,
  MessageType
} from '../../types/whatsapp.types.js';

/**
 * Serviço Baileys WhatsApp - Multi-tenant com Pairing Code
 *
 * REGRAS:
 * - SEMPRE usar pairing code como método principal
 * - SEMPRE persistir sessões em /app/sessions
 * - SEMPRE isolar por organization_id
 * - NUNCA processar mensagens síncronamente (usar BullMQ)
 * - SEMPRE usar auto-reconnect via ConnectionHandler
 */
export class BaileysService {
  private instances = new Map<string, BaileysInstance>();

  constructor() {
    // Configurar emitter Socket.IO no connection handler
    // (será configurado externamente via setSocketEmitter)
  }

  /**
   * Define emitter Socket.IO para eventos real-time
   */
  setSocketEmitter(emitter: (event: string, data: any) => void): void {
    connectionHandler.setSocketEmitter(emitter);
  }

  /**
   * Gera chave única para instância (multi-tenant)
   */
  private getInstanceKey(organizationId: string, instanceId: string): string {
    return `${organizationId}_${instanceId}`;
  }

  /**
   * Inicializa instância WhatsApp com pairing code (método principal)
   */
  async initializeInstance(
    config: InitializeInstanceConfig
  ): Promise<InitializeInstanceResult> {
    const { organizationId, instanceId, phoneNumber, preferredAuthMethod = 'pairing_code' } = config;

    try {
      const instanceKey = this.getInstanceKey(organizationId, instanceId);

      // Verificar se já existe
      if (this.instances.has(instanceKey)) {
        return {
          success: false,
          instanceId,
          status: 'connected',
          error: 'Instance already running'
        };
      }

      logger.info({ organizationId, instanceId, phoneNumber }, 'Initializing WhatsApp instance');

      // Inicializar auth state via SessionManager
      const { state, saveCreds } = await sessionManager.initAuthState(organizationId, instanceId);

      // Fetch latest Baileys version
      const { version, isLatest } = await fetchLatestBaileysVersion();
      logger.info({ version, isLatest }, 'Using Baileys version');

      // Criar socket WhatsApp
      const sock = makeWASocket({
        version,
        logger: logger as any,
        printQRInTerminal: false, // NUNCA printar QR no terminal
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger as any)
        },
        browser: Browsers.ubuntu('Chrome'),
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        getMessage: async () => undefined // Prevenir erros de mensagens antigas
      });

      // Event: credentials update
      sock.ev.on('creds.update', saveCreds);

      // Event: connection update
      sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(organizationId, instanceId, sock, update);
      });

      // Event: incoming messages (SEMPRE via BullMQ)
      sock.ev.on('messages.upsert', async (msg) => {
        await this.handleIncomingMessages(organizationId, instanceId, msg);
      });

      // Guardar instância
      const instance: BaileysInstance = {
        sock,
        organizationId,
        instanceId,
        phoneNumber,
        status: 'connecting',
        authMethod: preferredAuthMethod,
        createdAt: new Date(),
        lastActivity: new Date(),
        reconnectAttempts: 0
      };

      this.instances.set(instanceKey, instance);

      // Pairing code (método principal)
      if (phoneNumber && preferredAuthMethod === 'pairing_code' && !sock.authState.creds.registered) {
        try {
          const pairingCode = await sock.requestPairingCode(phoneNumber);
          logger.info({ organizationId, instanceId, pairingCode }, 'Pairing code generated');

          await connectionHandler.handlePairingCode(organizationId, instanceId, pairingCode);

          return {
            success: true,
            instanceId,
            status: 'pairing_pending',
            pairingCode
          };
        } catch (error) {
          logger.error({ error, organizationId, instanceId }, 'Failed to generate pairing code');

          // Fallback para QR code se falhar
          if (preferredAuthMethod === 'pairing_code') {
            logger.warn({ organizationId, instanceId }, 'Falling back to QR code');
            // QR será gerado no próximo connection.update
          }
        }
      }

      return {
        success: true,
        instanceId,
        status: 'connecting'
      };
    } catch (error) {
      logger.error({ error, organizationId, instanceId }, 'Failed to initialize instance');
      return {
        success: false,
        instanceId,
        status: 'failed',
        error: (error as Error).message
      };
    }
  }

  /**
   * Trata updates de conexão
   */
  private async handleConnectionUpdate(
    organizationId: string,
    instanceId: string,
    sock: WASocket,
    update: any
  ): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    // QR Code gerado (fallback)
    if (qr) {
      const qrCodeData = await QRCode.toDataURL(qr);
      await connectionHandler.handleQRCode(organizationId, instanceId, qrCodeData);
    }

    // Conexão fechada
    if (connection === 'close') {
      const error = lastDisconnect?.error;

      await connectionHandler.handleDisconnect(
        organizationId,
        instanceId,
        error,
        async () => {
          // Função de reconexão
          await this.reconnectInstance(organizationId, instanceId);
        }
      );

      // Remover instância se não vai reconectar
      if (!connectionHandler.shouldReconnect(error)) {
        const instanceKey = this.getInstanceKey(organizationId, instanceId);
        this.instances.delete(instanceKey);
      }
    }

    // Conexão aberta (sucesso!)
    if (connection === 'open') {
      await connectionHandler.handleConnected(organizationId, instanceId, sock);

      // Atualizar metadata da sessão
      await sessionManager.updateLastConnected(organizationId, instanceId);

      // Atualizar instância local
      const instanceKey = this.getInstanceKey(organizationId, instanceId);
      const instance = this.instances.get(instanceKey);
      if (instance) {
        instance.status = 'connected';
        instance.lastActivity = new Date();
        instance.reconnectAttempts = 0;
      }
    }
  }

  /**
   * Reconecta instância (chamado pelo ConnectionHandler)
   */
  private async reconnectInstance(organizationId: string, instanceId: string): Promise<void> {
    logger.info({ organizationId, instanceId }, 'Reconnecting instance');

    const instanceKey = this.getInstanceKey(organizationId, instanceId);
    const instance = this.instances.get(instanceKey);

    // Remover instância antiga
    if (instance) {
      this.instances.delete(instanceKey);
    }

    // Reinicializar
    await this.initializeInstance({
      organizationId,
      instanceId,
      phoneNumber: instance?.phoneNumber,
      preferredAuthMethod: instance?.authMethod || 'pairing_code'
    });
  }

  /**
   * Processa mensagens recebidas (SEMPRE via BullMQ)
   */
  private async handleIncomingMessages(
    organizationId: string,
    instanceId: string,
    msg: { messages: proto.IWebMessageInfo[]; type: 'notify' | 'append' }
  ): Promise<void> {
    for (const message of msg.messages) {
      // Ignorar mensagens próprias
      if (!message.message || message.key.fromMe) continue;

      const from = message.key.remoteJid!;
      const phoneNumber = from.split('@')[0];
      const content = this.extractMessageContent(message);
      const messageType = this.detectMessageType(message);

      const messageData: IncomingMessageData = {
        organizationId,
        instanceId,
        from,
        phoneNumber,
        content,
        messageId: message.key.id!,
        timestamp: Number(message.messageTimestamp),
        messageType
      };

      logger.info(
        { organizationId, instanceId, from: phoneNumber, messageType },
        'Incoming WhatsApp message'
      );

      // SEMPRE enviar para BullMQ (NUNCA processar síncronamente)
      try {
        await messageQueue.add('process-message', messageData, {
          removeOnComplete: true,
          attempts: 3
        });
      } catch (error) {
        logger.error({ error, messageData }, 'Failed to queue message');
      }

      // Atualizar last activity
      const instanceKey = this.getInstanceKey(organizationId, instanceId);
      const instance = this.instances.get(instanceKey);
      if (instance) {
        instance.lastActivity = new Date();
      }
    }
  }

  /**
   * Extrai conteúdo de mensagem
   */
  private extractMessageContent(message: proto.IWebMessageInfo): string {
    const msg = message.message;
    if (!msg) return '';

    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption || '[Image]';
    if (msg.videoMessage?.caption) return msg.videoMessage.caption || '[Video]';
    if (msg.documentMessage?.caption) return msg.documentMessage.caption || '[Document]';
    if (msg.audioMessage) return '[Audio]';
    if (msg.stickerMessage) return '[Sticker]';
    if (msg.locationMessage) return '[Location]';
    if (msg.contactMessage) return '[Contact]';

    return '[Unknown message type]';
  }

  /**
   * Detecta tipo de mensagem
   */
  private detectMessageType(message: proto.IWebMessageInfo): MessageType {
    const msg = message.message;
    if (!msg) return 'unknown';

    if (msg.conversation || msg.extendedTextMessage) return 'text';
    if (msg.imageMessage) return 'image';
    if (msg.videoMessage) return 'video';
    if (msg.audioMessage) return 'audio';
    if (msg.documentMessage) return 'document';
    if (msg.stickerMessage) return 'sticker';
    if (msg.locationMessage) return 'location';
    if (msg.contactMessage) return 'contact';

    return 'unknown';
  }

  /**
   * Envia mensagem de texto
   */
  async sendTextMessage(message: TextMessage): Promise<SendMessageResult> {
    try {
      const instance = this.getInstance(message.instanceId, message.organizationId);
      const jid = this.formatJid(message.to);

      const sent = await instance.sock.sendMessage(jid, { text: message.text });

      return {
        success: true,
        messageId: sent?.key.id || undefined,
        timestamp: Number(sent?.messageTimestamp) || 0,
        protoMessage: sent || undefined
      };
    } catch (error) {
      logger.error({ error, message }, 'Failed to send text message');
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Envia imagem
   */
  async sendImageMessage(message: MediaMessage): Promise<SendMessageResult> {
    try {
      const instance = this.getInstance(message.instanceId, message.organizationId);
      const jid = this.formatJid(message.to);

      const sent = await instance.sock.sendMessage(jid, {
        image: message.mediaBuffer,
        caption: message.caption
      });

      return {
        success: true,
        messageId: sent?.key.id || undefined,
        timestamp: Number(sent?.messageTimestamp) || 0,
        protoMessage: sent || undefined
      };
    } catch (error) {
      logger.error({ error, message }, 'Failed to send image message');
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Envia áudio (PTT ou arquivo)
   */
  async sendAudioMessage(message: AudioMessage): Promise<SendMessageResult> {
    try {
      const instance = this.getInstance(message.instanceId, message.organizationId);
      const jid = this.formatJid(message.to);

      const sent = await instance.sock.sendMessage(jid, {
        audio: message.audioBuffer,
        mimetype: 'audio/mp4',
        ptt: message.ptt ?? true
      });

      return {
        success: true,
        messageId: sent?.key.id || undefined,
        timestamp: Number(sent?.messageTimestamp) || 0,
        protoMessage: sent || undefined
      };
    } catch (error) {
      logger.error({ error, message }, 'Failed to send audio message');
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Obtém instância (com validação multi-tenant)
   */
  private getInstance(instanceId: string, organizationId?: string): BaileysInstance {
    for (const instance of this.instances.values()) {
      if (instance.instanceId === instanceId) {
        // Validar tenant se fornecido
        if (organizationId && instance.organizationId !== organizationId) {
          throw new Error('Unauthorized: Organization mismatch');
        }
        return instance;
      }
    }

    throw new Error('Instance not found');
  }

  /**
   * Formata número para JID WhatsApp
   */
  private formatJid(phone: string): string {
    // Se já é JID, retornar
    if (phone.includes('@')) {
      return phone;
    }

    // Limpar número
    const cleaned = phone.replace(/\D/g, '');

    // Individual: @s.whatsapp.net
    return `${cleaned}@s.whatsapp.net`;
  }

  /**
   * Verifica se instância está conectada
   */
  isConnected(instanceId: string, organizationId?: string): boolean {
    try {
      const instance = this.getInstance(instanceId, organizationId);
      return instance.status === 'connected' && !!instance.sock.user;
    } catch {
      return false;
    }
  }

  /**
   * Obtém status da instância
   */
  getStatus(instanceId: string, organizationId?: string): WhatsAppConnectionStatus {
    try {
      const instance = this.getInstance(instanceId, organizationId);
      return instance.status;
    } catch {
      return 'disconnected';
    }
  }

  /**
   * Health check completo
   */
  async getHealth(instanceId: string, organizationId?: string): Promise<InstanceHealth> {
    try {
      const instance = this.getInstance(instanceId, organizationId);
      const sessionExists = await sessionManager.sessionExists(
        instance.organizationId,
        instance.instanceId
      );

      const health = await connectionHandler.checkHealth(
        instance.organizationId,
        instance.instanceId,
        instance.sock
      );

      return {
        instanceId,
        isConnected: instance.status === 'connected',
        status: health.status,
        phoneNumber: instance.phoneNumber,
        lastActivity: instance.lastActivity,
        reconnectAttempts: health.reconnectAttempts,
        sessionExists
      };
    } catch {
      return {
        instanceId,
        isConnected: false,
        status: 'disconnected',
        lastActivity: new Date(0),
        reconnectAttempts: 0,
        sessionExists: false
      };
    }
  }

  /**
   * Desconecta e remove instância
   */
  async disconnect(instanceId: string, organizationId?: string): Promise<void> {
    try {
      const instance = this.getInstance(instanceId, organizationId);

      logger.info({ organizationId: instance.organizationId, instanceId }, 'Disconnecting instance');

      // Logout do WhatsApp
      await instance.sock.logout();

      // Remover sessão
      await sessionManager.removeSession(instance.organizationId, instance.instanceId);

      // Limpar handler
      connectionHandler.cleanup(instance.organizationId, instance.instanceId);

      // Remover instância
      const instanceKey = this.getInstanceKey(instance.organizationId, instance.instanceId);
      this.instances.delete(instanceKey);

      logger.info({ organizationId: instance.organizationId, instanceId }, 'Instance disconnected');
    } catch (error) {
      logger.error({ error, instanceId }, 'Failed to disconnect instance');
      throw error;
    }
  }

  /**
   * Lista todas as instâncias ativas
   */
  listInstances(organizationId?: string): BaileysInstance[] {
    const instances = Array.from(this.instances.values());

    if (organizationId) {
      return instances.filter(i => i.organizationId === organizationId);
    }

    return instances;
  }

  /**
   * Força reconexão imediata
   */
  async forceReconnect(instanceId: string, organizationId?: string): Promise<void> {
    const instance = this.getInstance(instanceId, organizationId);

    await connectionHandler.forceReconnect(
      instance.organizationId,
      instance.instanceId,
      async () => {
        await this.reconnectInstance(instance.organizationId, instance.instanceId);
      }
    );
  }

  /**
   * Cleanup de sessões antigas (executar periodicamente)
   */
  async cleanupOldSessions(daysThreshold: number = 30): Promise<number> {
    return await sessionManager.cleanupOldSessions(daysThreshold);
  }
}

export const baileysService = new BaileysService();
