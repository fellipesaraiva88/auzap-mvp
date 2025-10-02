import { Router } from 'express';
import { ServicesService } from '../services/services.service';
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

    const service = await ServicesService.createService({
      organization_id,
      name,
      service_type,
      description,
      duration_minutes,
      price,
    });

    res.json(service);
  } catch (error: any) {
    logger.error({ error }, 'Error in POST /api/services');
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

    const service = await ServicesService.getServiceById(organization_id as string, id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/services/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/services
 * Listar serviços
 */
router.get('/', async (req, res) => {
  try {
    const { organization_id, service_type, is_active, search, limit, offset } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const result = await ServicesService.listServices(organization_id as string, {
      service_type: service_type as string,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/services');
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

    const service = await ServicesService.updateService(organization_id, id, updates);
    res.json(service);
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

    const result = await ServicesService.deleteService(organization_id as string, id);
    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error in DELETE /api/services/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/services/analytics/popular
 * Buscar serviços mais populares
 */
router.get('/analytics/popular', async (req, res) => {
  try {
    const { organization_id, date_from, date_to, limit } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const services = await ServicesService.getPopularServices(
      organization_id as string,
      date_from as string,
      date_to as string,
      limit ? parseInt(limit as string) : 10
    );

    res.json(services);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/services/analytics/popular');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/services/analytics/revenue
 * Calcular receita por serviço
 */
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { organization_id, date_from, date_to } = req.query;

    if (!organization_id || !date_from || !date_to) {
      return res.status(400).json({ error: 'organization_id, date_from and date_to required' });
    }

    const revenue = await ServicesService.getServiceRevenue(
      organization_id as string,
      date_from as string,
      date_to as string
    );

    res.json(revenue);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/services/analytics/revenue');
    res.status(500).json({ error: error.message });
  }
});

export default router;
