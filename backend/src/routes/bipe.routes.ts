import { Router } from 'express';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { BipeService } from '../services/bipe/bipe.service.js';
import { KnowledgeBaseService } from '../services/knowledge-base/knowledge-base.service.js';
import { logger } from '../config/logger.js';
import type { TenantRequest } from '../middleware/tenant.middleware.js';

const router = Router();

/**
 * GET /api/v1/bipe/pending
 * Listar BIPEs pendentes
 */
router.get('/pending', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const bipes = await BipeService.listPendingBipes(organizationId);

    res.json({ bipes });
  } catch (error) {
    logger.error({ error }, 'Error listing pending BIPEs');
    res.status(500).json({ error: 'Failed to list pending BIPEs' });
  }
});

/**
 * POST /api/v1/bipe/:id/respond
 * Responder BIPE (Cenário 1 - IA não sabe)
 */
router.post('/:id/respond', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { response, instanceId } = req.body;

    if (!response) {
      return res.status(400).json({ error: 'Response is required' });
    }

    if (!instanceId) {
      return res.status(400).json({ error: 'instanceId is required' });
    }

    const bipe = await BipeService.processManagerResponse(id, response, instanceId);

    res.json(bipe);
  } catch (error) {
    logger.error({ error }, 'Error responding to BIPE');
    res.status(500).json({ error: 'Failed to respond to BIPE' });
  }
});

/**
 * POST /api/v1/bipe/conversations/:conversationId/reactivate
 * Reativar IA após handoff (Cenário 2)
 */
router.post('/conversations/:conversationId/reactivate', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;
    const { conversationId } = req.params;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    await BipeService.reactivateAI(conversationId, organizationId);

    res.json({ success: true, message: 'AI reactivated successfully' });
  } catch (error) {
    logger.error({ error }, 'Error reactivating AI');
    res.status(500).json({ error: 'Failed to reactivate AI' });
  }
});

/**
 * GET /api/v1/bipe/knowledge
 * Listar entradas do Knowledge Base
 */
router.get('/knowledge', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const { source, limit, offset, sortBy } = req.query;

    const result = await KnowledgeBaseService.listEntries(organizationId, {
      source: source as 'bipe' | 'manual' | 'import',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      sortBy: sortBy as 'recent' | 'usage' | 'alphabetical'
    });

    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Error listing knowledge entries');
    res.status(500).json({ error: 'Failed to list knowledge entries' });
  }
});

/**
 * POST /api/v1/bipe/knowledge
 * Adicionar entrada manual ao KB
 */
router.post('/knowledge', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const entry = await KnowledgeBaseService.addEntry({
      organizationId,
      question,
      answer,
      source: 'manual'
    });

    res.status(201).json(entry);
  } catch (error) {
    logger.error({ error }, 'Error adding knowledge entry');
    res.status(500).json({ error: 'Failed to add knowledge entry' });
  }
});

/**
 * GET /api/v1/bipe/knowledge/stats
 * Estatísticas do KB
 */
router.get('/knowledge/stats', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const stats = await KnowledgeBaseService.getStats(organizationId);

    res.json(stats);
  } catch (error) {
    logger.error({ error }, 'Error fetching KB stats');
    res.status(500).json({ error: 'Failed to fetch KB stats' });
  }
});

/**
 * PATCH /api/v1/bipe/knowledge/:id
 * Atualizar entrada do KB
 */
router.patch('/knowledge/:id', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    const entry = await KnowledgeBaseService.updateEntry(id, organizationId, req.body);

    res.json(entry);
  } catch (error) {
    logger.error({ error }, 'Error updating knowledge entry');
    res.status(500).json({ error: 'Failed to update knowledge entry' });
  }
});

/**
 * DELETE /api/v1/bipe/knowledge/:id
 * Deletar entrada do KB
 */
router.delete('/knowledge/:id', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context missing' });
    }

    await KnowledgeBaseService.deleteEntry(id, organizationId);

    res.status(204).send();
  } catch (error) {
    logger.error({ error }, 'Error deleting knowledge entry');
    res.status(500).json({ error: 'Failed to delete knowledge entry' });
  }
});

export default router;
