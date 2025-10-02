import { Router } from 'express';
import { BaileysService } from '../services/baileys.service';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/whatsapp/instances
 * Criar nova instância WhatsApp
 */
router.post('/instances', async (req, res) => {
  try {
    const { organization_id, instance_name, phone_number } = req.body;

    if (!organization_id || !instance_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Criar instância no banco
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .insert({
        organization_id,
        instance_name,
        phone_number,
        status: 'disconnected',
        pairing_method: 'code',
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, instance });
  } catch (error: any) {
    logger.error({ error }, 'Error creating WhatsApp instance');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:id/connect
 * Conectar instância com pairing code
 */
router.post('/instances/:id/connect', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone_number, method = 'code' } = req.body;

    // Buscar instância
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)
      .single();

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Inicializar Baileys
    const result = await BaileysService.initializeInstance(
      instance.organization_id,
      id,
      phone_number,
      method
    );

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error connecting WhatsApp instance');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/instances/:id/status
 * Verificar status da instância
 */
router.get('/instances/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)
      .single();

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const baileyInstance = BaileysService.getInstance(
      instance.organization_id,
      id
    );

    res.json({
      instance,
      is_running: !!baileyInstance,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error getting instance status');
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/whatsapp/instances/:id
 * Desconectar e remover instância
 */
router.delete('/instances/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('whatsapp_instances')
      .update({ status: 'disconnected' })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error deleting instance');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:id/send
 * Enviar mensagem
 */
router.post('/instances/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)
      .single();

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    await BaileysService.sendMessage(
      instance.organization_id,
      id,
      to,
      message
    );

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error sending message');
    res.status(500).json({ error: error.message });
  }
});

export default router;
