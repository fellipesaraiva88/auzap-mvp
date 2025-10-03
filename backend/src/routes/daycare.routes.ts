import { Router } from 'express';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { DaycareService } from '../services/daycare/daycare.service.js';
import { logger } from '../config/logger.js';
import type { TenantRequest } from '../middleware/tenant.middleware.js';

const router = Router();

/**
 * POST /api/v1/daycare/stays
 * Criar nova estadia
 */
router.post('/stays', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const stay = await DaycareService.createStay({
      organizationId,
      ...req.body
    });

    res.status(201).json(stay);
  } catch (error) {
    logger.error({ error }, 'Error creating stay');
    res.status(500).json({ error: 'Failed to create stay' });
  }
});

/**
 * GET /api/v1/daycare/stays
 * Listar estadias
 */
router.get('/stays', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const { status, stayType, startDate, endDate, limit, offset } = req.query;

    const result = await DaycareService.listStays(organizationId, {
      status: status as string,
      stayType: stayType as 'daycare' | 'hotel',
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Error listing stays');
    res.status(500).json({ error: 'Failed to list stays' });
  }
});

/**
 * GET /api/v1/daycare/stays/:id
 * Buscar estadia por ID
 */
router.get('/stays/:id', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const stay = await DaycareService.getStay(id, organizationId);

    if (!stay) {
      return res.status(404).json({ error: 'Stay not found' });
    }

    res.json(stay);
  } catch (error) {
    logger.error({ error }, 'Error fetching stay');
    res.status(500).json({ error: 'Failed to fetch stay' });
  }
});

/**
 * GET /api/v1/daycare/stays/:id/upsells
 * Sugerir serviços extras (upsell)
 */
router.get('/stays/:id/upsells', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    const suggestions = await DaycareService.suggestUpsells(id);

    res.json({ suggestions });
  } catch (error) {
    logger.error({ error }, 'Error generating upsell suggestions');
    res.status(500).json({ error: 'Failed to generate upsell suggestions' });
  }
});

/**
 * PATCH /api/v1/daycare/stays/:id
 * Atualizar estadia
 */
router.patch('/stays/:id', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const stay = await DaycareService.updateStay(id, organizationId, req.body);

    res.json(stay);
  } catch (error) {
    logger.error({ error }, 'Error updating stay');
    res.status(500).json({ error: 'Failed to update stay' });
  }
});

/**
 * POST /api/v1/daycare/stays/:id/services
 * Adicionar serviço extra (upsell aceito)
 */
router.post('/stays/:id/services', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;
    const { service } = req.body;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    if (!service) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    const stay = await DaycareService.addExtraService(id, organizationId, service);

    res.json(stay);
  } catch (error) {
    logger.error({ error }, 'Error adding extra service');
    res.status(500).json({ error: 'Failed to add extra service' });
  }
});

export default router;
