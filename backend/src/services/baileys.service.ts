import makeWASocket, {
  DisconnectReason,
  WASocket,
  fetchLatestBaileysVersion,
  Browsers,
  delay,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { supabase } from '../config/supabase';
import { messageQueue } from '../config/redis';
import { logger } from '../config/logger';
import { BaileysInstance, SessionData, PairingMethod } from '../types';
import { io } from '../index';
import { ConversationsService } from './conversations.service';
import { ContactsService } from './contacts.service';
import { BaileysHealthService } from './baileys-health.service';
import { BaileysReconnectService } from './baileys-reconnect.service';

const instances = new Map<string, BaileysInstance>();
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 5000;

export class BaileysService {
  /**
   * Inicializa instância WhatsApp com pairing code preferencial
   */
  static async initializeInstance(
    organizationId: string,
    instanceId: string,
    phoneNumber?: string,
    preferredMethod: PairingMethod = 'code'
  ): Promise<{
    success: boolean;
    pairingCode?: string;
    qrCode?: string;
    method?: PairingMethod;
    error?: string;
  }> {
    try {
      const existingKey = `${organizationId}:${instanceId}`;
      if (instances.has(existingKey)) {
        logger.info({ organizationId, instanceId }, 'Instance already exists');
        return { success: true, method: instances.get(existingKey)?.pairingMethod };
      }

      // Buscar dados da instância
      const { data: instanceData, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', instanceId)
        .single();

      if (fetchError || !instanceData) {
        throw new Error('Instance not found in database');
      }

      // Session data do banco
      const sessionData = (instanceData.session_data || {}) as SessionData;

      const { version } = await fetchLatestBaileysVersion();

      // Criar auth state básico
      const authState = {
        creds: sessionData.creds || {},
        keys: sessionData.keys || {},
      };

      // Criar socket
      const socket = makeWASocket({
        version,
        logger: logger.child({ module: 'baileys' }),
        auth: {
          creds: authState.creds,
          keys: makeCacheableSignalKeyStore(authState.keys, logger),
        },
        browser: Browsers.macOS('AuZap'),
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      // Salvar instância
      const instance: BaileysInstance = {
        socket,
        organizationId,
        instanceId,
        reconnectAttempts: 0,
        isConnecting: true,
        pairingMethod: preferredMethod,
      };

      instances.set(existingKey, instance);

      // Setup event handlers
      this.setupEventHandlers(socket, instance, async (creds, keys) => {
        await supabase
          .from('whatsapp_instances')
          .update({
            session_data: { creds, keys },
          })
          .eq('id', instanceId);
      });

      // Gerar pairing code se método preferido
      if (preferredMethod === 'code' && phoneNumber) {
        const code = await socket.requestPairingCode(phoneNumber);

        await supabase
          .from('whatsapp_instances')
          .update({
            pairing_code: code,
            pairing_code_expires_at: new Date(Date.now() + 60000).toISOString(),
            status: 'qr_pending',
          })
          .eq('id', instanceId);

        // Emitir pairing code via Socket.IO
        io.to(`org-${organizationId}`).emit('whatsapp:pairing-code', {
          instanceId,
          code,
          timestamp: new Date().toISOString(),
        });

        return { success: true, pairingCode: code, method: 'code' };
      }

      return { success: true, method: preferredMethod };
    } catch (error: any) {
      logger.error({ error, organizationId, instanceId }, 'Failed to initialize instance');
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup event handlers
   */
  private static setupEventHandlers(
    socket: WASocket,
    instance: BaileysInstance,
    saveCreds: (creds: any, keys: any) => Promise<void>
  ) {
    // Connection updates
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Capturar e emitir QR Code
      if (qr) {
        logger.info({ instanceId: instance.instanceId }, 'QR Code generated');
        
        // Salvar QR no banco
        await supabase
          .from('whatsapp_instances')
          .update({
            qr_code: qr,
            status: 'qr_pending',
          })
          .eq('id', instance.instanceId);

        // Emitir QR via Socket.IO para o frontend
        io.to(`org-${instance.organizationId}`).emit('whatsapp:qr', {
          instanceId: instance.instanceId,
          qr,
          timestamp: new Date().toISOString(),
        });
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

        logger.info({ shouldReconnect }, 'Connection closed');

        if (shouldReconnect && instance.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          instance.reconnectAttempts++;
          await delay(RECONNECT_DELAY_MS * instance.reconnectAttempts);

          await supabase
            .from('whatsapp_instances')
            .update({ status: 'connecting' })
            .eq('id', instance.instanceId);
        } else {
          await supabase
            .from('whatsapp_instances')
            .update({ status: 'disconnected' })
            .eq('id', instance.instanceId);

          // Emitir evento de desconexão
          io.to(`org-${instance.organizationId}`).emit('whatsapp:disconnected', {
            instanceId: instance.instanceId,
            reason: lastDisconnect?.error?.message || 'Unknown',
            timestamp: new Date().toISOString(),
          });
        }
      } else if (connection === 'open') {
        logger.info('Connection opened');
        instance.reconnectAttempts = 0;

        // Buscar número do telefone conectado
        const phoneNumber = socket.user?.id?.split(':')[0] || 'unknown';

        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            last_connected_at: new Date().toISOString(),
            phone_number: phoneNumber,
          })
          .eq('id', instance.instanceId);

        // Emitir evento de conexão via Socket.IO
        io.to(`org-${instance.organizationId}`).emit('whatsapp:connected', {
          instanceId: instance.instanceId,
          phoneNumber,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Mensagens recebidas
    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        for (const msg of messages) {
          if (!msg.key.fromMe && msg.message) {
            // Adicionar na fila para processamento
            await messageQueue.add('process-message', {
              organizationId: instance.organizationId,
              instanceId: instance.instanceId,
              message: msg,
            });
          }
        }
      }
    });

    // Salvar credenciais
    socket.ev.on('creds.update', async () => {
      const creds = socket.authState.creds;
      const keys = socket.authState.keys;
      await saveCreds(creds, keys);
    });
  }

  /**
   * Enviar mensagem
   */
  static async sendMessage(
    organizationId: string,
    instanceId: string,
    to: string,
    content: string
  ) {
    const key = `${organizationId}:${instanceId}`;
    const instance = instances.get(key);

    if (!instance) {
      throw new Error('Instance not found');
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    
    await instance.socket.sendMessage(jid, { text: content });
    
    await supabase
      .from('whatsapp_instances')
      .update({
        messages_sent_count: supabase.rpc('increment', { x: 1 }),
      })
      .eq('id', instanceId);
  }

  /**
   * Obter instância
   */
  static getInstance(organizationId: string, instanceId: string): BaileysInstance | undefined {
    return instances.get(`${organizationId}:${instanceId}`);
  }

  /**
   * Processar mensagem recebida (usado pelo event handler)
   */
  static async handleIncomingMessage(
    organizationId: string,
    instanceId: string,
    message: any
  ): Promise<void> {
    try {
      // Extrair dados da mensagem
      const from = message.key.remoteJid;
      const messageId = message.key.id;
      const messageType = Object.keys(message.message || {})[0];

      logger.info(
        {
          from,
          messageId,
          messageType,
          organizationId,
          instanceId,
        },
        '[BAILEYS] Incoming message received'
      );

      // Extrair conteúdo
      let content = '';
      let contentType: 'text' | 'image' | 'audio' | 'video' | 'document' = 'text';
      let mediaUrl: string | undefined;

      // Processar diferentes tipos de mensagem
      if (messageType === 'conversation') {
        content = message.message.conversation;
        contentType = 'text';
      } else if (messageType === 'extendedTextMessage') {
        content = message.message.extendedTextMessage.text;
        contentType = 'text';
      } else if (messageType === 'imageMessage') {
        content = message.message.imageMessage.caption || '[Imagem]';
        contentType = 'image';
        // TODO: implementar download de mídia
      } else if (messageType === 'audioMessage') {
        content = '[Áudio]';
        contentType = 'audio';
      } else if (messageType === 'videoMessage') {
        content = message.message.videoMessage.caption || '[Vídeo]';
        contentType = 'video';
      } else if (messageType === 'documentMessage') {
        content = message.message.documentMessage.fileName || '[Documento]';
        contentType = 'document';
      }

      if (!content) {
        logger.warn(
          { messageType, organizationId, instanceId },
          '[BAILEYS] No content extracted from message'
        );
        return;
      }

      // Limpar número do remetente
      const senderPhone = from.split('@')[0];

      // Buscar ou criar contato
      let contact = await ContactsService.getContactByPhone(organizationId, senderPhone);

      if (!contact) {
        contact = await ContactsService.createContact({
          organization_id: organizationId,
          phone: senderPhone,
          name: senderPhone, // Será atualizado depois
        });
      }

      // Buscar ou criar conversa
      const conversation = await ConversationsService.findOrCreateConversation(
        organizationId,
        contact.id,
        instanceId
      );

      // Salvar mensagem
      await ConversationsService.saveIncomingMessage(
        organizationId,
        conversation.id,
        {
          whatsapp_message_id: messageId,
          sender_phone: senderPhone,
          content,
          content_type: contentType,
          media_url: mediaUrl,
          metadata: {
            message_type: messageType,
            timestamp: message.messageTimestamp,
          },
        }
      );

      logger.info(
        {
          contactId: contact.id,
          conversationId: conversation.id,
          contentType,
          organizationId,
        },
        '[BAILEYS] Message saved successfully'
      );

      // Emitir evento via Socket.IO para o frontend
      io.to(`org-${organizationId}`).emit('whatsapp:message', {
        conversationId: conversation.id,
        contactId: contact.id,
        message: {
          id: messageId,
          content,
          contentType,
          direction: 'incoming',
          timestamp: new Date().toISOString(),
        },
      });

      logger.info(
        { organizationId, conversationId: conversation.id },
        '[BAILEYS] Message event emitted to frontend'
      );
    } catch (error: any) {
      logger.error(
        { error, organizationId, instanceId },
        '[BAILEYS] Error handling incoming message'
      );
      throw error;
    }
  }
}
