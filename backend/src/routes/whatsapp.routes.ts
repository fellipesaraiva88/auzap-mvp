import { Router, Request, Response } from 'express';
import { baileysService } from '../services/baileys/baileys.service.js';
import { logger } from '../config/logger.js';

const router = Router();

/**
 * POST /api/whatsapp/instances
 * Cria uma nova instância WhatsApp
 */
router.post('/instances', async (req: Request, res: Response): Promise<void> => {
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
router.post('/send', async (req: Request, res: Response): Promise<void> => {
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
router.get('/instances/:instanceId/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID required' });
      return;
    }

    // Check connection via Baileys service
    const isConnected = baileysService.isConnected(instanceId);

    // Get instance details from database
    const { data: instance } = await import('../config/supabase.js').then(m => m.supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('organization_id', organizationId)
      .single()
    );

    res.json({
      connected: isConnected,
      status: isConnected ? 'connected' : 'disconnected',
      instance: instance || null,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error({ error }, 'Error checking instance status');
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/whatsapp/instances/:instanceId
 * Desconecta instância
 */
router.delete('/instances/:instanceId', async (req: Request, res: Response): Promise<void> => {
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
