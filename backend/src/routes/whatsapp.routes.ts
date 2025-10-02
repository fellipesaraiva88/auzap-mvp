import { Router } from 'express';
import { baileysService } from '../services/baileys/baileys.service.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * POST /api/whatsapp/instances
 * Cria uma nova instância WhatsApp
 */
router.post('/instances', async (req, res) => {
  try {
    const { organizationId, instanceId, phoneNumber } = req.body;

    const result = await baileysService.initializeInstance(
      organizationId,
      instanceId,
      phoneNumber
    );

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error creating WhatsApp instance');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/send
 * Envia mensagem de texto
 */
router.post('/send', async (req, res) => {
  try {
    const { instanceId, to, message } = req.body;

    const result = await baileysService.sendTextMessage(instanceId, to, message);

    res.json({ success: true, messageId: result.key.id });
  } catch (error: any) {
    logger.error({ error }, 'Error sending message');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/instances/:instanceId/status
 * Verifica status da conexão
 */
router.get('/instances/:instanceId/status', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const isConnected = baileysService.isConnected(instanceId);

    res.json({ connected: isConnected });
  } catch (error: any) {
    logger.error({ error }, 'Error checking instance status');
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/whatsapp/instances/:instanceId
 * Desconecta instância
 */
router.delete('/instances/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    await baileysService.disconnect(instanceId);

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error disconnecting instance');
    res.status(500).json({ error: error.message });
  }
});

export default router;
