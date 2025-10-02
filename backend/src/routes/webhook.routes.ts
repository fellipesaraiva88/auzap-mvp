import { Router } from 'express';
import { messageQueue } from '../config/redis';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /webhook/whatsapp/:instanceId
 * Webhook para receber mensagens do WhatsApp
 * (Usado internamente pelo BaileysService)
 */
router.post('/whatsapp/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { organizationId, message } = req.body;

    if (!organizationId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Adicionar mensagem na fila para processamento
    await messageQueue.add('process-message', {
      organizationId,
      instanceId,
      message,
    });

    logger.info({ instanceId, organizationId }, 'Message queued for processing');

    res.json({ success: true, queued: true });
  } catch (error: any) {
    logger.error({ error }, 'Error processing webhook');
    res.status(500).json({ error: error.message });
  }
});

export default router;
