import makeWASocket, {
  DisconnectReason,
  WASocket,
  fetchLatestBaileysVersion,
  Browsers,
  delay,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { supabase } from '../config/supabase';
import { messageQueue } from '../config/redis';
import { logger } from '../config/logger';
import { BaileysInstance, SessionData, PairingMethod } from '../types';
import { io } from '../index';

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
        }
      } else if (connection === 'open') {
        logger.info('Connection opened');
        instance.reconnectAttempts = 0;
        
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connected',
            last_connected_at: new Date().toISOString(),
          })
          .eq('id', instance.instanceId);
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
}
