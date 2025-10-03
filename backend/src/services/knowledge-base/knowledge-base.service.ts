import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { TablesInsert, Tables } from '../../types/database.types.js';

export interface KnowledgeEntry {
  organizationId: string;
  question: string;
  answer: string;
  source?: 'bipe' | 'manual' | 'import';
  learnedFromBipeId?: string;
}

/**
 * KnowledgeBaseService - Base de Conhecimento Organizacional
 *
 * OBJETIVO: Loop de aprendizado contínuo
 * 1. BIPE → resposta do gestor → salvo no KB
 * 2. IA busca no KB antes de acionar BIPE
 * 3. KB cresce organicamente → menos BIPEs futuros
 *
 * FEATURES:
 * - Full-text search em português
 * - Tracking de uso (qual resposta mais usada)
 * - Múltiplas fontes (BIPE, manual, import)
 */
export class KnowledgeBaseService {
  /**
   * Adicionar entrada ao KB
   */
  static async addEntry(input: KnowledgeEntry): Promise<Tables<'knowledge_base'>> {
    try {
      logger.info({
        organizationId: input.organizationId,
        source: input.source
      }, 'Adding knowledge base entry');

      const entryData: TablesInsert<'knowledge_base'> = {
        organization_id: input.organizationId,
        question: input.question.trim(),
        answer: input.answer.trim(),
        source: input.source || 'manual',
        learned_from_bipe_id: input.learnedFromBipeId
      };

      const { data, error } = await supabaseAdmin
        .from('knowledge_base')
        .insert(entryData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({ entryId: data.id }, 'Knowledge base entry added');
      return data as Tables<'knowledge_base'>;
    } catch (error) {
      logger.error({ error }, 'Failed to add knowledge base entry');
      throw error;
    }
  }

  /**
   * Buscar no KB usando full-text search (PostgreSQL)
   *
   * IMPORTANTE: Usa to_tsvector para busca semântica em português
   * Exemplo: busca por "vacina" encontra "vacinação", "vacinas", etc.
   */
  static async searchKnowledge(
    organizationId: string,
    query: string
  ): Promise<Tables<'knowledge_base'>[]> {
    try {
      logger.info({ organizationId, query }, 'Searching knowledge base');

      // Busca full-text usando PostgreSQL
      const { data, error } = await supabaseAdmin
        .from('knowledge_base')
        .select('*')
        .eq('organization_id', organizationId)
        .textSearch('question', query, {
          type: 'websearch',
          config: 'portuguese'
        })
        .order('usage_count', { ascending: false }) // Mais usadas primeiro
        .limit(5); // Top 5 resultados

      if (error) {
        throw error;
      }

      logger.info({
        query,
        resultsFound: data?.length || 0
      }, 'Knowledge search completed');

      return (data || []) as Tables<'knowledge_base'>[];
    } catch (error) {
      logger.error({ error, query }, 'Error searching knowledge base');
      throw error;
    }
  }

  /**
   * Buscar entrada exata por pergunta
   */
  static async findExactMatch(
    organizationId: string,
    question: string
  ): Promise<Tables<'knowledge_base'> | null> {
    try {
      const normalizedQuestion = question.trim().toLowerCase();

      const { data, error } = await supabaseAdmin
        .from('knowledge_base')
        .select('*')
        .eq('organization_id', organizationId)
        .ilike('question', normalizedQuestion)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        throw error;
      }

      return data as Tables<'knowledge_base'>;
    } catch (error) {
      logger.error({ error, question }, 'Error finding exact match');
      return null;
    }
  }

  /**
   * Incrementar contador de uso
   *
   * IMPORTANTE: Usa função SQL para atomicidade
   */
  static async incrementUsage(knowledgeId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.rpc('increment_knowledge_usage', {
        knowledge_id: knowledgeId
      });

      if (error) {
        throw error;
      }

      logger.debug({ knowledgeId }, 'Knowledge usage incremented');
    } catch (error) {
      logger.error({ error, knowledgeId }, 'Failed to increment usage');
      // Não falhar a operação principal se tracking falhar
    }
  }

  /**
   * Listar todas as entradas do KB
   */
  static async listEntries(
    organizationId: string,
    options?: {
      source?: 'bipe' | 'manual' | 'import';
      limit?: number;
      offset?: number;
      sortBy?: 'recent' | 'usage' | 'alphabetical';
    }
  ) {
    try {
      let query = supabaseAdmin
        .from('knowledge_base')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId);

      // Filtro por fonte
      if (options?.source) {
        query = query.eq('source', options.source);
      }

      // Ordenação
      const sortBy = options?.sortBy || 'recent';
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'usage') {
        query = query.order('usage_count', { ascending: false });
      } else if (sortBy === 'alphabetical') {
        query = query.order('question', { ascending: true });
      }

      // Paginação
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        entries: (data || []) as Tables<'knowledge_base'>[],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error listing knowledge entries');
      throw error;
    }
  }

  /**
   * Atualizar entrada do KB
   */
  static async updateEntry(
    entryId: string,
    organizationId: string,
    updates: {
      question?: string;
      answer?: string;
    }
  ): Promise<Tables<'knowledge_base'>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('knowledge_base')
        .update(updates)
        .eq('id', entryId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({ entryId }, 'Knowledge base entry updated');
      return data as Tables<'knowledge_base'>;
    } catch (error) {
      logger.error({ error, entryId }, 'Error updating knowledge entry');
      throw error;
    }
  }

  /**
   * Deletar entrada do KB
   */
  static async deleteEntry(
    entryId: string,
    organizationId: string
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('knowledge_base')
        .delete()
        .eq('id', entryId)
        .eq('organization_id', organizationId);

      if (error) {
        throw error;
      }

      logger.info({ entryId }, 'Knowledge base entry deleted');
    } catch (error) {
      logger.error({ error, entryId }, 'Error deleting knowledge entry');
      throw error;
    }
  }

  /**
   * Obter estatísticas do KB
   */
  static async getStats(organizationId: string): Promise<{
    totalEntries: number;
    entriesBySource: Record<string, number>;
    mostUsedEntries: Array<{
      question: string;
      usageCount: number;
    }>;
    recentlyAdded: number; // últimas 24h
  }> {
    try {
      // Total de entradas
      const { count: totalEntries } = await supabaseAdmin
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      // Por fonte
      const { data: bySource } = await supabaseAdmin
        .from('knowledge_base')
        .select('source')
        .eq('organization_id', organizationId);

      const entriesBySource: Record<string, number> = {};
      bySource?.forEach(entry => {
        entriesBySource[entry.source] = (entriesBySource[entry.source] || 0) + 1;
      });

      // Mais usadas
      const { data: mostUsed } = await supabaseAdmin
        .from('knowledge_base')
        .select('question, usage_count')
        .eq('organization_id', organizationId)
        .order('usage_count', { ascending: false })
        .limit(5);

      // Recentes (24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count: recentCount } = await supabaseAdmin
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', yesterday.toISOString());

      return {
        totalEntries: totalEntries || 0,
        entriesBySource,
        mostUsedEntries: (mostUsed || []).map(e => ({
          question: e.question,
          usageCount: e.usage_count || 0
        })),
        recentlyAdded: recentCount || 0
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error getting KB stats');
      throw error;
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
