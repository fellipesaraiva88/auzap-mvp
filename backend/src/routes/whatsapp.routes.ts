import { Router, Response } from 'express';
import { baileysService } from '../services/baileys/baileys.service.js';
import { logger } from '../config/logger.js';
import { webhookLimiter, standardLimiter } from '../middleware/rate-limiter.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';
import type {
  InitializeInstanceConfig,
  TextMessage,
  MediaMessage,
  AudioMessage
} from '../types/whatsapp.types.js';

const router = Router();

// Webhook routes get special high-volume rate limiting
router.use('/webhook', webhookLimiter);

// Todas as outras rotas usam tenant middleware + rate limiting padrão
router.use(tenantMiddleware);
router.use(standardLimiter);

/**
 * POST /api/whatsapp/instances
 * Inicializa nova instância WhatsApp com pairing code (método principal)
 *
 * Body: { organizationId, instanceId, phoneNumber, preferredAuthMethod?: 'pairing_code' | 'qr_code' }
 */
router.post('/instances', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId, phoneNumber, preferredAuthMethod } = req.body;
    const organizationId = req.organizationId!;

    if (!instanceId) {
      res.status(400).json({ error: 'instanceId is required' });
      return;
    }

    const config: InitializeInstanceConfig = {
      organizationId,
      instanceId,
      phoneNumber,
      preferredAuthMethod: preferredAuthMethod || 'pairing_code'
    };

    logger.info({ organizationId, instanceId, phoneNumber, preferredAuthMethod }, 'Initializing WhatsApp instance');

    const result = await baileysService.initializeInstance(config);

    // Validar resposta
    if (!result.success) {
      logger.error({ result }, 'Failed to initialize instance');
      res.status(500).json(result);
      return;
    }

    // Validar QR code quando método é qr_code
    if (config.preferredAuthMethod === 'qr_code' && !result.qrCode) {
      logger.error({ result }, 'QR code not generated');
      res.status(500).json({
        success: false,
        error: 'Failed to generate QR code - try again'
      });
      return;
    }

    // Validar pairing code quando método é pairing_code
    if (config.preferredAuthMethod === 'pairing_code' && phoneNumber && !result.pairingCode) {
      logger.error({ result }, 'Pairing code not generated');
      res.status(500).json({
        success: false,
        error: 'Failed to generate pairing code - try again or use QR code'
      });
      return;
    }

    logger.info({ result }, 'WhatsApp instance initialized successfully');
    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error initializing WhatsApp instance');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:instanceId/pairing-code
 * Gera novo pairing code para instância existente
 */
router.post('/instances/:instanceId/pairing-code', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const { phoneNumber } = req.body;
    const organizationId = req.organizationId!;

    if (!phoneNumber) {
      res.status(400).json({ error: 'phoneNumber is required' });
      return;
    }

    const config: InitializeInstanceConfig = {
      organizationId,
      instanceId,
      phoneNumber,
      preferredAuthMethod: 'pairing_code'
    };

    const result = await baileysService.initializeInstance(config);

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error generating pairing code');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/instances
 * Lista todas as instâncias da organização
 */
router.get('/instances', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    const instances = baileysService.listInstances(organizationId);

    const instancesData = instances.map(instance => ({
      instanceId: instance.instanceId,
      organizationId: instance.organizationId,
      phoneNumber: instance.phoneNumber,
      status: instance.status,
      authMethod: instance.authMethod,
      lastActivity: instance.lastActivity,
      reconnectAttempts: instance.reconnectAttempts
    }));

    res.json({
      instances: instancesData,
      count: instancesData.length
    });
  } catch (error: any) {
    logger.error({ error }, 'Error listing instances');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/instances/:instanceId/status
 * Verifica status detalhado da conexão
 */
router.get('/instances/:instanceId/status', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const organizationId = req.organizationId!;

    const isConnected = baileysService.isConnected(instanceId, organizationId);
    const status = baileysService.getStatus(instanceId, organizationId);

    res.json({
      instanceId,
      connected: isConnected,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error({ error }, 'Error checking instance status');
    res.status(500).json({
      instanceId: req.params.instanceId,
      connected: false,
      status: 'disconnected',
      error: error.message
    });
  }
});

/**
 * GET /api/whatsapp/instances/:instanceId/health
 * Health check completo da instância
 */
router.get('/instances/:instanceId/health', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const organizationId = req.organizationId!;

    const health = await baileysService.getHealth(instanceId, organizationId);

    res.json(health);
  } catch (error: any) {
    logger.error({ error }, 'Error checking instance health');
    res.status(503).json({
      instanceId: req.params.instanceId,
      isConnected: false,
      status: 'disconnected',
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/send/text
 * Envia mensagem de texto
 *
 * Body: { instanceId, to, text }
 */
router.post('/send/text', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId, to, text } = req.body;
    const organizationId = req.organizationId!;

    if (!instanceId || !to || !text) {
      res.status(400).json({ error: 'instanceId, to and text are required' });
      return;
    }

    const message: TextMessage = {
      instanceId,
      organizationId,
      to,
      text
    };

    const result = await baileysService.sendTextMessage(message);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error({ error }, 'Error sending text message');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/send/image
 * Envia imagem com caption opcional
 *
 * Body: { instanceId, to, mediaBuffer (base64), caption? }
 */
router.post('/send/image', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId, to, mediaBuffer, caption } = req.body;
    const organizationId = req.organizationId!;

    if (!instanceId || !to || !mediaBuffer) {
      res.status(400).json({ error: 'instanceId, to and mediaBuffer are required' });
      return;
    }

    // Converter base64 para Buffer
    const buffer = Buffer.from(mediaBuffer, 'base64');

    const message: MediaMessage = {
      instanceId,
      organizationId,
      to,
      mediaBuffer: buffer,
      caption
    };

    const result = await baileysService.sendImageMessage(message);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error({ error }, 'Error sending image message');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/send/audio
 * Envia áudio (PTT ou arquivo)
 *
 * Body: { instanceId, to, audioBuffer (base64), ptt?: boolean }
 */
router.post('/send/audio', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId, to, audioBuffer, ptt } = req.body;
    const organizationId = req.organizationId!;

    if (!instanceId || !to || !audioBuffer) {
      res.status(400).json({ error: 'instanceId, to and audioBuffer are required' });
      return;
    }

    // Converter base64 para Buffer
    const buffer = Buffer.from(audioBuffer, 'base64');

    const message: AudioMessage = {
      instanceId,
      organizationId,
      to,
      audioBuffer: buffer,
      ptt: ptt ?? true
    };

    const result = await baileysService.sendAudioMessage(message);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error({ error }, 'Error sending audio message');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:instanceId/reconnect
 * Força reconexão imediata da instância
 */
router.post('/instances/:instanceId/reconnect', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const organizationId = req.organizationId!;

    await baileysService.forceReconnect(instanceId, organizationId);

    res.json({
      success: true,
      message: 'Reconnect initiated'
    });
  } catch (error: any) {
    logger.error({ error }, 'Error forcing reconnect');
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/whatsapp/instances/:instanceId
 * Desconecta e remove instância (logout)
 */
router.delete('/instances/:instanceId', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const organizationId = req.organizationId!;

    await baileysService.disconnect(instanceId, organizationId);

    res.json({ success: true, message: 'Instance disconnected' });
  } catch (error: any) {
    logger.error({ error }, 'Error disconnecting instance');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:instanceId/verify
 * Verifica conexão real enviando mensagem de teste
 */
router.post('/instances/:instanceId/verify', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const organizationId = req.organizationId!;

    logger.info({ instanceId, organizationId }, 'Verifying WhatsApp connection');

    const result = await baileysService.verifyConnection(instanceId, organizationId);

    if (result.verified) {
      res.json({
        success: true,
        verified: true,
        messageId: result.messageId,
        message: 'Connection verified successfully. Check your WhatsApp for confirmation message.'
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        error: result.error
      });
    }
  } catch (error: any) {
    logger.error({ error }, 'Error verifying connection');
    res.status(500).json({
      success: false,
      verified: false,
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/health-check
 * Trigger manual health check (valida todas as instâncias)
 */
router.post('/health-check', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId;

    const { triggerWhatsAppHealthCheck } = await import('../queue/jobs/whatsapp-health-check.job.js');

    await triggerWhatsAppHealthCheck(organizationId);

    res.json({
      success: true,
      message: 'Health check triggered',
      organizationId: organizationId || 'all'
    });
  } catch (error: any) {
    logger.error({ error }, 'Error triggering health check');
    res.status(500).json({ error: error.message });
  }
});

export default router;
