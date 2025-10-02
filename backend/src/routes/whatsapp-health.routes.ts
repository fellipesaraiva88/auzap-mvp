import { Router } from 'express';
import { BaileysService } from '../services/baileys.service';
import { BaileysHealthService } from '../services/baileys-health.service';
import { BaileysReconnectService } from '../services/baileys-reconnect.service';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/whatsapp/health/:instanceId
 * Health check detalhado de uma instância
 */
router.get('/health/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;

    // Buscar instância do banco
    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (!instanceData) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Obter instância Baileys (se estiver rodando)
    const baileyInstance = BaileysService.getInstance(
      instanceData.organization_id,
      instanceId
    );

    // Obter health status
    const health = await BaileysHealthService.getHealthStatus(
      instanceData.organization_id,
      instanceId,
      baileyInstance
    );

    res.json(health);
  } catch (error: any) {
    logger.error({ error }, 'Error getting health status');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/diagnostics/:instanceId
 * Diagnóstico completo com recomendações
 */
router.get('/diagnostics/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;

    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (!instanceData) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const baileyInstance = BaileysService.getInstance(
      instanceData.organization_id,
      instanceId
    );

    const diagnostics = await BaileysHealthService.runDiagnostics(
      instanceData.organization_id,
      instanceId,
      baileyInstance
    );

    res.json(diagnostics);
  } catch (error: any) {
    logger.error({ error }, 'Error running diagnostics');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/health/all
 * Health status de todas as instâncias ativas
 */
router.get('/health/all', async (req, res) => {
  try {
    const { data: instances } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .in('status', ['connected', 'connecting', 'reconnecting']);

    if (!instances || instances.length === 0) {
      return res.json([]);
    }

    const healthStatuses = await Promise.all(
      instances.map(async (instance) => {
        const baileyInstance = BaileysService.getInstance(
          instance.organization_id,
          instance.id
        );

        return BaileysHealthService.getHealthStatus(
          instance.organization_id,
          instance.id,
          baileyInstance
        );
      })
    );

    res.json(healthStatuses);
  } catch (error: any) {
    logger.error({ error }, 'Error getting all health statuses');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:id/restart
 * Soft restart - mantém session
 */
router.post('/instances/:id/restart', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)
      .single();

    if (!instanceData) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Cancelar reconexão em andamento
    BaileysReconnectService.cancelReconnect(instanceData.organization_id, id);

    // Backup da sessão antes de restart
    await BaileysHealthService.backupSession(instanceData.organization_id, id);

    // Atualizar status
    await supabase
      .from('whatsapp_instances')
      .update({ status: 'restarting' })
      .eq('id', id);

    // Reinicializar
    const result = await BaileysService.initializeInstance(
      instanceData.organization_id,
      id,
      instanceData.phone_number,
      instanceData.pairing_method
    );

    res.json({
      success: result.success,
      message: 'Instance restarted',
      ...result,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error restarting instance');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:id/regenerate-qr
 * Re-gerar QR Code
 */
router.post('/instances/:id/regenerate-qr', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)
      .single();

    if (!instanceData) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Limpar QR antigo
    await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: null,
        pairing_code: null,
        pairing_code_expires_at: null,
      })
      .eq('id', id);

    // Gerar novo QR
    const result = await BaileysService.initializeInstance(
      instanceData.organization_id,
      id,
      instanceData.phone_number,
      'qr'
    );

    res.json({
      success: result.success,
      message: 'New QR code will be emitted via Socket.IO',
    });
  } catch (error: any) {
    logger.error({ error }, 'Error regenerating QR code');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:id/force-reconnect
 * Forçar reconexão imediata
 */
router.post('/instances/:id/force-reconnect', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)
      .single();

    if (!instanceData) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    // Validar session antes de reconectar
    const validation = await BaileysReconnectService.validateSessionBeforeReconnect(
      instanceData.organization_id,
      id
    );

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Session validation failed',
        issues: validation.issues,
        recommendation: 'Clear session and reconnect from scratch',
      });
    }

    // Forçar reconexão
    const result = await BaileysService.initializeInstance(
      instanceData.organization_id,
      id,
      instanceData.phone_number,
      instanceData.pairing_method
    );

    res.json({
      success: result.success,
      message: 'Reconnection initiated',
      ...result,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error forcing reconnect');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/instances/:id/reconnect-history
 * Histórico de reconexões
 */
router.get('/instances/:id/reconnect-history', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!instanceData) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const history = BaileysReconnectService.getReconnectHistory(
      instanceData.organization_id,
      id
    );

    res.json(history || { attempts: 0, successfulReconnects: 0, failedReconnects: 0 });
  } catch (error: any) {
    logger.error({ error }, 'Error getting reconnect history');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:id/backup-session
 * Backup manual da sessão
 */
router.post('/instances/:id/backup-session', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!instanceData) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const success = await BaileysHealthService.backupSession(
      instanceData.organization_id,
      id
    );

    res.json({
      success,
      message: success ? 'Session backed up successfully' : 'Failed to backup session',
    });
  } catch (error: any) {
    logger.error({ error }, 'Error backing up session');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/instances/:id/validate-session
 * Validar session data
 */
router.post('/instances/:id/validate-session', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', id)
      .single();

    if (!instanceData) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const validation = BaileysHealthService.validateSessionData(
      instanceData.session_data
    );

    res.json(validation);
  } catch (error: any) {
    logger.error({ error }, 'Error validating session');
    res.status(500).json({ error: error.message });
  }
});

export default router;
