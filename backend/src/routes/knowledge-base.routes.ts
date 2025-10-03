import { Router, Response } from 'express';
import { z } from 'zod';
import { knowledgeBaseService, type CreateKnowledgeBaseData, type UpdateKnowledgeBaseData, type ListEntriesFilters } from '../services/knowledge-base/knowledge-base.service.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware, adminOrOwner, validateResource } from '../middleware/tenant.middleware.js';
import { readLimiter, standardLimiter } from '../middleware/rate-limiter.js';

const router = Router();

// Apply tenant middleware FIRST
router.use(tenantMiddleware);

/**
 * Validation Schemas
 */
const createEntrySchema = z.object({
  category: z.enum(['servicos', 'precos', 'horarios', 'politicas', 'emergencias', 'geral']),
  question: z.string().min(10, 'Pergunta deve ter no mínimo 10 caracteres').max(500),
  answer: z.string().min(20, 'Resposta deve ter no mínimo 20 caracteres').max(2000),
  tags: z.array(z.string()).optional(),
  aiEnabled: z.boolean().optional().default(true),
  priority: z.number().int().min(1).max(10).optional().default(5)
});

const updateEntrySchema = z.object({
  question: z.string().min(10).max(500).optional(),
  answer: z.string().min(20).max(2000).optional(),
  category: z.enum(['servicos', 'precos', 'horarios', 'politicas', 'emergencias', 'geral']).optional(),
  tags: z.array(z.string()).optional(),
  aiEnabled: z.boolean().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  isActive: z.boolean().optional()
});

const searchSchema = z.object({
  q: z.string().min(3, 'Query deve ter no mínimo 3 caracteres'),
  limit: z.number().int().positive().max(50).optional().default(10)
});

const suggestSchema = z.object({
  question: z.string().min(5, 'Pergunta deve ter no mínimo 5 caracteres')
});

/**
 * POST /api/knowledge-base
 * Criar entrada (apenas owner/admin)
 */
router.post(
  '/',
  adminOrOwner,
  standardLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const userId = req.userId;
      const validatedData = createEntrySchema.parse(req.body);

      const data: CreateKnowledgeBaseData = {
        organization_id: organizationId,
        category: validatedData.category,
        question: validatedData.question,
        answer: validatedData.answer,
        tags: validatedData.tags,
        priority: validatedData.priority,
        ai_enabled: validatedData.aiEnabled,
        created_by: userId
      };

      const entry = await knowledgeBaseService.createEntry(data);

      logger.info({ entryId: entry.id, organizationId }, 'Knowledge base entry created');
      res.status(201).json({ entry });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      logger.error({ error, organizationId: req.organizationId }, 'Create knowledge entry error');
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/knowledge-base
 * Listar entradas (query: category?, tags?, search?, active?, limit?, offset?)
 */
router.get(
  '/',
  readLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;

      const filters: ListEntriesFilters = {
        category: req.query.category as any,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        search: req.query.search as string,
        active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const entries = await knowledgeBaseService.listEntries(organizationId, filters);

      res.json({
        entries,
        count: entries.length,
        limit: filters.limit,
        offset: filters.offset
      });
    } catch (error: any) {
      logger.error({ error, organizationId: req.organizationId }, 'List knowledge entries error');
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/knowledge-base/search
 * Buscar conhecimento (query: q, limit?)
 * Full-text search usando algoritmo semântico
 */
router.get(
  '/search',
  readLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const validatedQuery = searchSchema.parse({
        q: req.query.q,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      });

      const results = await knowledgeBaseService.searchKnowledge(
        organizationId,
        validatedQuery.q,
        validatedQuery.limit
      );

      res.json({
        results,
        query: validatedQuery.q,
        count: results.length
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      logger.error({ error, organizationId: req.organizationId }, 'Search knowledge error');
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/knowledge-base/suggest
 * Sugerir resposta para pergunta (body: {question})
 * Usa IA para sugerir melhor resposta
 */
router.post(
  '/suggest',
  readLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const validatedData = suggestSchema.parse(req.body);

      const suggestion = await knowledgeBaseService.suggestAnswer(
        organizationId,
        validatedData.question
      );

      if (!suggestion) {
        res.json({
          suggested: false,
          message: 'Nenhuma resposta encontrada na base de conhecimento',
          confidence: 0
        });
        return;
      }

      res.json({
        suggested: true,
        answer: suggestion.answer,
        confidence: suggestion.confidence,
        sourceEntries: suggestion.source_entries,
        generatedBy: suggestion.generated_by
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      logger.error({ error, organizationId: req.organizationId }, 'Suggest answer error');
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/knowledge-base/popular
 * Entradas mais usadas (query: limit?)
 */
router.get(
  '/popular',
  readLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const popular = await knowledgeBaseService.getPopularEntries(
        organizationId,
        Math.min(limit, 50)
      );

      res.json({
        popular,
        count: popular.length
      });
    } catch (error: any) {
      logger.error({ error, organizationId: req.organizationId }, 'Get popular entries error');
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/knowledge-base/stats
 * Estatísticas do KB
 */
router.get(
  '/stats',
  readLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const stats = await knowledgeBaseService.getStats(organizationId);

      res.json({ stats });
    } catch (error: any) {
      logger.error({ error, organizationId: req.organizationId }, 'Get KB stats error');
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/knowledge-base/category/:category
 * Filtrar por categoria
 */
router.get(
  '/category/:category',
  readLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const { category } = req.params;

      // Validar categoria
      const validCategories = ['servicos', 'precos', 'horarios', 'politicas', 'emergencias', 'geral'];
      if (!validCategories.includes(category)) {
        res.status(400).json({
          error: 'Invalid category',
          validCategories
        });
        return;
      }

      const entries = await knowledgeBaseService.getEntriesByCategory(
        organizationId,
        category as any
      );

      res.json({
        category,
        entries,
        count: entries.length
      });
    } catch (error: any) {
      logger.error({ error, organizationId: req.organizationId }, 'Get entries by category error');
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/knowledge-base/:id
 * Detalhes da entrada (com validação de organização)
 */
router.get(
  '/:id',
  validateResource('id', 'knowledge_base'),
  readLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const entry = await knowledgeBaseService.getEntry(id);

      if (!entry) {
        res.status(404).json({ error: 'Knowledge base entry not found' });
        return;
      }

      res.json({ entry });
    } catch (error: any) {
      logger.error({ error, entryId: req.params.id }, 'Get knowledge entry error');
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * PUT /api/knowledge-base/:id
 * Atualizar entrada (apenas owner/admin, com validação de organização)
 */
router.put(
  '/:id',
  adminOrOwner,
  validateResource('id', 'knowledge_base'),
  standardLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const validatedData = updateEntrySchema.parse(req.body);

      const updates: UpdateKnowledgeBaseData = {
        question: validatedData.question,
        answer: validatedData.answer,
        category: validatedData.category,
        tags: validatedData.tags,
        ai_enabled: validatedData.aiEnabled,
        priority: validatedData.priority,
        is_active: validatedData.isActive,
        updated_by: userId
      };

      const entry = await knowledgeBaseService.updateEntry(id, updates);

      if (!entry) {
        res.status(404).json({ error: 'Knowledge base entry not found' });
        return;
      }

      logger.info({ entryId: id }, 'Knowledge base entry updated');
      res.json({ entry });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      logger.error({ error, entryId: req.params.id }, 'Update knowledge entry error');
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * DELETE /api/knowledge-base/:id
 * Deletar entrada (apenas owner/admin, com validação de organização)
 * Soft delete - apenas marca como inativa
 */
router.delete(
  '/:id',
  adminOrOwner,
  validateResource('id', 'knowledge_base'),
  standardLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const success = await knowledgeBaseService.deleteEntry(id);

      if (!success) {
        res.status(404).json({ error: 'Knowledge base entry not found' });
        return;
      }

      logger.info({ entryId: id }, 'Knowledge base entry deleted');
      res.status(204).send();
    } catch (error: any) {
      logger.error({ error, entryId: req.params.id }, 'Delete knowledge entry error');
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
