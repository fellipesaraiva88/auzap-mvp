import { Router } from 'express';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { TrainingService } from '../services/training/training.service.js';
import { logger } from '../config/logger.js';
import type { TenantRequest } from '../middleware/tenant.middleware.js';

const router = Router();

/**
 * POST /api/v1/training/plans
 * Criar novo plano de adestramento
 */
router.post('/plans', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const plan = await TrainingService.createTrainingPlan({
      organizationId,
      ...req.body
    });

    return res.status(201).json(plan);
  } catch (error) {
    logger.error({ error }, 'Error creating training plan');
    return res.status(500).json({ error: 'Failed to create training plan' });
  }
});

/**
 * GET /api/v1/training/plans
 * Listar planos de adestramento
 */
router.get('/plans', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const { status, petId, limit, offset } = req.query;

    const result = await TrainingService.listTrainingPlans(organizationId, {
      status: status as string,
      petId: petId as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    return res.json(result);
  } catch (error) {
    logger.error({ error }, 'Error listing training plans');
    return res.status(500).json({ error: 'Failed to list training plans' });
  }
});

/**
 * GET /api/v1/training/plans/:id
 * Buscar plano por ID
 */
router.get('/plans/:id', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const plan = await TrainingService.getTrainingPlan(id, organizationId);

    if (!plan) {
      return res.status(404).json({ error: 'Training plan not found' });
    }

    return res.json(plan);
  } catch (error) {
    logger.error({ error }, 'Error fetching training plan');
    return res.status(500).json({ error: 'Failed to fetch training plan' });
  }
});

/**
 * PATCH /api/v1/training/plans/:id
 * Atualizar plano
 */
router.patch('/plans/:id', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const plan = await TrainingService.updateTrainingPlan(id, organizationId, req.body);

    return res.json(plan);
  } catch (error) {
    logger.error({ error }, 'Error updating training plan');
    return res.status(500).json({ error: 'Failed to update training plan' });
  }
});

/**
 * DELETE /api/v1/training/plans/:id
 * Cancelar plano
 */
router.delete('/plans/:id', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    await TrainingService.cancelTrainingPlan(id, organizationId);

    return res.status(204).send();
  } catch (error) {
    logger.error({ error }, 'Error cancelling training plan');
    return res.status(500).json({ error: 'Failed to cancel training plan' });
  }
});

export default router;
