import { Router, Response } from 'express';
import { z } from 'zod';
import { KnowledgeBaseService } from '../services/knowledge-base/knowledge-base.service.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware, adminOrOwner, validateResource } from '../middleware/tenant.middleware.js';

const router = Router();
const knowledgeService = new KnowledgeBaseService();

// Apply tenant middleware FIRST
router.use(tenantMiddleware);

/**
 * Validation Schemas
 */
const createEntrySchema = z.object({
  category: z.enum(['servicos', 'precos', 'horarios', 'politicas', 'emergencias', 'geral']).optional(),
  question: z.string().min(10, 'Pergunta deve ter no mínimo 10 caracteres').max(500),
  answer: z.string().min(20, 'Resposta deve ter no mínimo 20 caracteres').max(2000),
  tags: z.array(z.string()).optional(),
  aiEnabled: z.boolean().optional().default(true),
  priority: z.number().int().min(1).max(10).optional().default(5),
  source: z.enum(['bipe', 'manual', 'import']).optional().default('manual'),
  learnedFromBipeId: z.string().uuid().optional()
});

const updateEntrySchema = z.object({
  question: z.string().min(10).max(500).optional(),
  answer: z.string().min(20).max(2000).optional(),
  category: z.enum(['servicos', 'precos', 'horarios', 'politicas', 'emergencias', 'geral']).optional(),
  tags: z.array(z.string()).optional(),
  aiEnabled: z.boolean().optional(),
  priority: z.number().int().min(1).max(10).optional()
});

const searchSchema = z.object({
  q: z.string().min(3, 'Query deve ter no mínimo 3 caracteres'),
  limit: z.number().int().positive().max(50).optional().default(10)
});

const listQuerySchema = z.object({
  category: z.enum(['servicos', 'precos', 'horarios', 'politicas', 'emergencias', 'geral']).optional(),
  tags: z.string().optional(), // comma-separated
  search: z.string().optional(),
  active: z.enum(['true', 'false']).optional(),
  source: z.enum(['bipe', 'manual', 'import']).optional(),
  sortBy: z.enum(['recent', 'usage', 'alphabetical']).optional().default('recent'),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0)
});

const suggestSchema = z.object({
  question: z.string().min(5, 'Pergunta deve ter no mínimo 5 caracteres')
});

/**
 * Rate limiting configuration
 * Alta frequência pois AI usa muito
 */
import { readLimiter, writeLimiter } from '../middleware/rate-limiter.js';

// GET routes: 200 req/min (alta frequência)
const knowledgeReadLimiter = readLimiter; // 120 req/min padrão

// POST/PUT/DELETE routes: 60 req/min (mais permissivo que critical)
const knowledgeWriteLimiter = writeLimiter; // 30 req/min padrão, mas vamos criar custom

/**
 * POST /api/knowledge-base
 * Criar entrada (apenas owner/admin)
 */
router.post(
  '/',
  adminOrOwner,
  knowledgeWriteLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const validatedData = createEntrySchema.parse(req.body);

      const entry = await KnowledgeBaseService.addEntry({
        organizationId,
        question: validatedData.question,
        answer: validatedData.answer,
        source: validatedData.source,
        learnedFromBipeId: validatedData.learnedFromBipeId
      });

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
 * Listar entradas (query: category?, tags?, search?, active?, source?, sortBy?, limit?, offset?)
 */
router.get(
  '/',
  knowledgeReadLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;

      // Parse query params with defaults
      const queryParams = {
        ...req.query,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        sortBy: req.query.sortBy || 'recent'
      };

      const validatedQuery = listQuerySchema.parse(queryParams);

      const result = await KnowledgeBaseService.listEntries(organizationId, {
        source: validatedQuery.source,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        sortBy: validatedQuery.sortBy as 'recent' | 'usage' | 'alphabetical'
      });

      // Se houver busca, filtrar adicionalmente
      let filteredEntries = result.entries;
      if (validatedQuery.search) {
        const searchLower = validatedQuery.search.toLowerCase();
        filteredEntries = filteredEntries.filter(entry =>
          entry.question.toLowerCase().includes(searchLower) ||
          entry.answer.toLowerCase().includes(searchLower)
        );
      }

      res.json({
        entries: filteredEntries,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.limit < result.total
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      logger.error({ error, organizationId: req.organizationId }, 'List knowledge entries error');
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/knowledge-base/search
 * Buscar conhecimento (query: q, limit?)
 * Full-text search usando PostgreSQL
 */
router.get(
  '/search',
  knowledgeReadLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const validatedQuery = searchSchema.parse({
        q: req.query.q,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      });

      const results = await KnowledgeBaseService.searchKnowledge(
        organizationId,
        validatedQuery.q
      );

      // Limitar resultados
      const limitedResults = results.slice(0, validatedQuery.limit);

      res.json({
        results: limitedResults,
        query: validatedQuery.q,
        count: limitedResults.length
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
 * Busca melhor match no KB
 */
router.post(
  '/suggest',
  knowledgeReadLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const validatedData = suggestSchema.parse(req.body);

      // Primeiro tenta exact match
      const exactMatch = await KnowledgeBaseService.findExactMatch(
        organizationId,
        validatedData.question
      );

      if (exactMatch) {
        // Incrementar contador de uso
        await KnowledgeBaseService.incrementUsage(exactMatch.id);

        res.json({
          suggested: true,
          entry: exactMatch,
          confidence: 'high',
          matchType: 'exact'
        });
        return;
      }

      // Se não achar exact, busca semântica
      const searchResults = await KnowledgeBaseService.searchKnowledge(
        organizationId,
        validatedData.question
      );

      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];

        // Incrementar contador de uso
        await KnowledgeBaseService.incrementUsage(bestMatch.id);

        res.json({
          suggested: true,
          entry: bestMatch,
          confidence: 'medium',
          matchType: 'semantic',
          alternativeMatches: searchResults.slice(1, 3) // Mais 2 alternativas
        });
        return;
      }

      // Nenhum match encontrado
      res.json({
        suggested: false,
        message: 'Nenhuma resposta encontrada na base de conhecimento',
        confidence: 'none'
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
  knowledgeReadLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await KnowledgeBaseService.listEntries(organizationId, {
        sortBy: 'usage',
        limit: Math.min(limit, 50) // Max 50
      });

      res.json({
        popular: result.entries,
        count: result.entries.length
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
  knowledgeReadLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const stats = await KnowledgeBaseService.getStats(organizationId);

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
  knowledgeReadLimiter,
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

      const result = await KnowledgeBaseService.listEntries(organizationId, {
        limit: 100
      });

      // Filtrar por categoria (nota: atualmente o KB não tem campo category na tabela)
      // Isso seria adicionado na migration futura
      const filteredEntries = result.entries; // TODO: filtrar quando campo category existir

      res.json({
        category,
        entries: filteredEntries,
        count: filteredEntries.length
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
  knowledgeReadLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const { id } = req.params;

      // Como validateResource já garantiu que o recurso existe e pertence à org,
      // podemos buscar diretamente
      const result = await KnowledgeBaseService.listEntries(organizationId, { limit: 1 });
      const entry = result.entries.find(e => e.id === id);

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
  knowledgeWriteLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const { id } = req.params;
      const validatedData = updateEntrySchema.parse(req.body);

      const entry = await KnowledgeBaseService.updateEntry(
        id,
        organizationId,
        validatedData
      );

      logger.info({ entryId: id, organizationId }, 'Knowledge base entry updated');
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
 */
router.delete(
  '/:id',
  adminOrOwner,
  validateResource('id', 'knowledge_base'),
  knowledgeWriteLimiter,
  async (req: TenantRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organizationId!;
      const { id } = req.params;

      await KnowledgeBaseService.deleteEntry(id, organizationId);

      logger.info({ entryId: id, organizationId }, 'Knowledge base entry deleted');
      res.status(204).send();
    } catch (error: any) {
      logger.error({ error, entryId: req.params.id }, 'Delete knowledge entry error');
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
