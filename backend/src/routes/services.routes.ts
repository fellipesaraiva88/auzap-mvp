import { Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/services
 * Criar novo serviço
 */
router.post('/', async (req, res) => {
  try {
    const {
      organization_id,
      name,
      service_type,
      description,
      duration_minutes,
      price,
    } = req.body;

    if (!organization_id || !name || !service_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: service, error } = await supabase
      .from('services')
      .insert({
        organization_id,
        name,
        service_type,
        description,
        duration_minutes: duration_minutes || 60,
        price: price || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info({ serviceId: service.id }, 'Service created');
    res.json(service);
  } catch (error: any) {
    logger.error({ error }, 'Error in POST /api/services');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/services
 * Listar serviços
 */
router.get('/', async (req, res) => {
  try {
    const { organization_id, is_active } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    let query = supabase
      .from('services')
      .select('*')
      .eq('organization_id', organization_id)
      .order('name', { ascending: true });

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/services');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/services/:id
 * Buscar serviço por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(data);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/services/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/services/:id
 * Atualizar serviço
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, ...updates } = req.body;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('organization_id', organization_id)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info({ serviceId: id }, 'Service updated');
    res.json(data);
  } catch (error: any) {
    logger.error({ error }, 'Error in PUT /api/services/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/services/:id
 * Deletar serviço (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('organization_id', organization_id)
      .eq('id', id);

    if (error) throw error;

    logger.info({ serviceId: id }, 'Service deleted');
    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error in DELETE /api/services/:id');
    res.status(500).json({ error: error.message });
  }
});

export default router;
