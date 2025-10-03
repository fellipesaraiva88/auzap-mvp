import { supabaseAdmin } from '../../config/supabase.js';
import { openai, AI_MODELS } from '../../config/openai.js';
import { logger } from '../../config/logger.js';
import type { TablesInsert, Tables } from '../../types/database.types.js';

// LEGACY INTERFACE (mantido para compatibilidade com BIPE)
export interface KnowledgeEntry {
  organizationId: string;
  question: string;
  answer: string;
  source?: 'bipe' | 'manual' | 'import';
  learnedFromBipeId?: string;
}

// NEW ENHANCED INTERFACE
export type KnowledgeBaseEntry = Tables<'knowledge_base'>;
export type KnowledgeBaseCategory = 'servicos' | 'precos' | 'horarios' | 'politicas' | 'emergencias' | 'geral';

export interface CreateKnowledgeBaseData {
  organization_id: string;
  category?: KnowledgeBaseCategory;
  question: string;
  answer: string;
  tags?: string[];
  priority?: number;
  ai_enabled?: boolean;
  created_by?: string;
  source?: 'bipe' | 'manual' | 'import';
  learned_from_bipe_id?: string;
}

export interface UpdateKnowledgeBaseData {
  category?: KnowledgeBaseCategory;
  question?: string;
  answer?: string;
  tags?: string[];
  priority?: number;
  ai_enabled?: boolean;
  is_active?: boolean;
  updated_by?: string;
}

export interface ListEntriesFilters {
  category?: KnowledgeBaseCategory;
  tags?: string[];
  search?: string;
  active?: boolean;
  ai_enabled?: boolean;
  source?: 'bipe' | 'manual' | 'import';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  entry: KnowledgeBaseEntry;
  relevance_score: number;
  match_type: 'exact' | 'partial' | 'tag' | 'semantic';
}

export interface SuggestedAnswer {
  answer: string;
  confidence: number;
  source_entries: KnowledgeBaseEntry[];
  generated_by: 'kb_match' | 'ai_generated';
}

/**
 * KnowledgeBaseService - Base de Conhecimento Organizacional COMPLETA
 *
 * OBJETIVO: Loop de aprendizado contínuo + FAQ management
 * 1. BIPE → resposta do gestor → salvo no KB
 * 2. IA busca no KB antes de acionar BIPE
 * 3. KB cresce organicamente → menos BIPEs futuros
 * 4. Gestão avançada com categorias, tags, prioridade
 *
 * FEATURES:
 * - Full-text search em português
 * - Tracking de uso (qual resposta mais usada)
 * - Múltiplas fontes (BIPE, manual, import)
 * - Categorização e tags
 * - Priorização e AI enablement
 * - Sugestão de respostas com OpenAI
 */
export class KnowledgeBaseService {
  // ==================== LEGACY STATIC METHODS (BIPE compatibility) ====================

  /**
   * @deprecated Use createEntry instance method instead
   * Mantido para compatibilidade com BIPE
   */
  static async addEntry(input: KnowledgeEntry): Promise<Tables<'knowledge_base'>> {
    try {
      logger.info({
        organizationId: input.organizationId,
        source: input.source
      }, 'Adding knowledge base entry (legacy)');

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
   * @deprecated Use searchKnowledge instance method instead
   */
  static async searchKnowledge(
    organizationId: string,
    query: string
  ): Promise<Tables<'knowledge_base'>[]> {
    try {
      logger.info({ organizationId, query }, 'Searching knowledge base (legacy)');

      const { data, error } = await supabaseAdmin
        .from('knowledge_base')
        .select('*')
        .eq('organization_id', organizationId)
        .textSearch('question', query, {
          type: 'websearch',
          config: 'portuguese'
        })
        .order('usage_count', { ascending: false })
        .limit(5);

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
   * @deprecated Use getEntry instance method instead
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
        if (error.code === 'PGRST116') {
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
   * @deprecated Use incrementUsage instance method instead
   */
  static async incrementUsage(knowledgeId: string): Promise<void> {
    const service = new KnowledgeBaseService();
    await service.incrementUsage(knowledgeId);
  }

  // ==================== NEW INSTANCE METHODS (Enhanced API) ====================

  /**
   * Cria nova entrada no Knowledge Base
   */
  async createEntry(data: CreateKnowledgeBaseData): Promise<KnowledgeBaseEntry> {
    try {
      const entryData: TablesInsert<'knowledge_base'> = {
        organization_id: data.organization_id,
        question: data.question,
        answer: data.answer,
        category: data.category || 'geral',
        tags: data.tags || [],
        priority: data.priority || 5,
        ai_enabled: data.ai_enabled ?? true,
        is_active: true,
        created_by: data.created_by,
        updated_by: data.created_by,
        source: data.source || 'manual',
        learned_from_bipe_id: data.learned_from_bipe_id,
        usage_count: 0
      };

      const { data: newEntry, error } = await supabaseAdmin
        .from('knowledge_base')
        .insert(entryData)
        .select()
        .single();

      if (error || !newEntry) {
        throw error || new Error('Failed to create knowledge base entry');
      }

      logger.info(
        {
          entryId: newEntry.id,
          organizationId: data.organization_id,
          category: data.category
        },
        'Knowledge base entry created'
      );

      return newEntry as KnowledgeBaseEntry;
    } catch (error) {
      logger.error({ error, data }, 'Error creating knowledge base entry');
      throw error;
    }
  }

  /**
   * Lista entradas do Knowledge Base com filtros
   */
  async listEntries(
    organizationId: string,
    filters?: ListEntriesFilters
  ): Promise<KnowledgeBaseEntry[]> {
    try {
      let query = supabaseAdmin
        .from('knowledge_base')
        .select('*')
        .eq('organization_id', organizationId);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.active !== undefined) {
        query = query.eq('is_active', filters.active);
      }

      if (filters?.ai_enabled !== undefined) {
        query = query.eq('ai_enabled', filters.ai_enabled);
      }

      if (filters?.source) {
        query = query.eq('source', filters.source);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters?.search) {
        query = query.or(
          `question.ilike.%${filters.search}%,answer.ilike.%${filters.search}%`
        );
      }

      query = query
        .order('priority', { ascending: false })
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error({ error, organizationId, filters }, 'Error listing knowledge base entries');
        return [];
      }

      return data as KnowledgeBaseEntry[];
    } catch (error) {
      logger.error({ error, organizationId, filters }, 'Error listing knowledge base entries');
      return [];
    }
  }

  /**
   * Busca entrada por ID
   */
  async getEntry(entryId: string): Promise<KnowledgeBaseEntry | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('knowledge_base')
        .select('*')
        .eq('id', entryId)
        .single();

      if (error) {
        logger.error({ error, entryId }, 'Error getting knowledge base entry');
        return null;
      }

      return data as KnowledgeBaseEntry;
    } catch (error) {
      logger.error({ error, entryId }, 'Error getting knowledge base entry');
      return null;
    }
  }

  /**
   * Atualiza entrada do Knowledge Base
   */
  async updateEntry(
    entryId: string,
    updates: UpdateKnowledgeBaseData
  ): Promise<KnowledgeBaseEntry | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('knowledge_base')
        .update(updates)
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        logger.error({ error, entryId, updates }, 'Error updating knowledge base entry');
        return null;
      }

      logger.info({ entryId }, 'Knowledge base entry updated');
      return data as KnowledgeBaseEntry;
    } catch (error) {
      logger.error({ error, entryId, updates }, 'Error updating knowledge base entry');
      return null;
    }
  }

  /**
   * Deleta entrada (soft delete)
   */
  async deleteEntry(entryId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('knowledge_base')
        .update({ is_active: false })
        .eq('id', entryId);

      if (error) {
        logger.error({ error, entryId }, 'Error deleting knowledge base entry');
        return false;
      }

      logger.info({ entryId }, 'Knowledge base entry deleted (soft delete)');
      return true;
    } catch (error) {
      logger.error({ error, entryId }, 'Error deleting knowledge base entry');
      return false;
    }
  }

  /**
   * Busca semântica no Knowledge Base
   */
  async searchKnowledge(
    organizationId: string,
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    try {
      const normalizedQuery = query.toLowerCase().trim();
      const results: SearchResult[] = [];

      const entries = await this.listEntries(organizationId, {
        active: true,
        ai_enabled: true
      });

      for (const entry of entries) {
        const normalizedQuestion = entry.question.toLowerCase();
        const normalizedAnswer = entry.answer.toLowerCase();
        const normalizedTags = (entry.tags || []).map(t => t.toLowerCase());

        let score = 0;
        let matchType: SearchResult['match_type'] = 'semantic';

        if (normalizedQuestion === normalizedQuery) {
          score = 100;
          matchType = 'exact';
        } else if (normalizedQuestion.includes(normalizedQuery) || normalizedQuery.includes(normalizedQuestion)) {
          score = 80;
          matchType = 'partial';
        } else if (normalizedTags.some(tag =>
          tag.includes(normalizedQuery) || normalizedQuery.includes(tag)
        )) {
          score = 60;
          matchType = 'tag';
        } else if (normalizedAnswer.includes(normalizedQuery)) {
          score = 40;
          matchType = 'semantic';
        } else {
          const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 3);
          const matchingWords = queryWords.filter(word =>
            normalizedQuestion.includes(word) || normalizedAnswer.includes(word)
          );

          if (matchingWords.length > 0) {
            score = 20 + (matchingWords.length / queryWords.length) * 20;
            matchType = 'semantic';
          }
        }

        score += (entry.priority || 5) * 2;
        score += Math.min((entry.usage_count || 0) / 10, 10);

        if (score > 0) {
          results.push({
            entry,
            relevance_score: Math.round(score * 100) / 100,
            match_type: matchType
          });
        }
      }

      results.sort((a, b) => b.relevance_score - a.relevance_score);
      return results.slice(0, limit);
    } catch (error) {
      logger.error({ error, organizationId, query }, 'Error searching knowledge base');
      return [];
    }
  }

  /**
   * Incrementa contador de uso da entrada
   */
  async incrementUsage(entryId: string): Promise<void> {
    try {
      await supabaseAdmin.rpc('increment_kb_usage', { entry_id: entryId });
      logger.info({ entryId }, 'Knowledge base usage incremented');
    } catch (error) {
      try {
        const entry = await this.getEntry(entryId);
        if (entry) {
          await supabaseAdmin
            .from('knowledge_base')
            .update({ usage_count: (entry.usage_count || 0) + 1, last_used_at: new Date().toISOString() })
            .eq('id', entryId);
        }
      } catch (fallbackError) {
        logger.error({ error: fallbackError, entryId }, 'Error incrementing knowledge base usage');
      }
    }
  }

  /**
   * Busca entradas mais populares
   */
  async getPopularEntries(
    organizationId: string,
    limit: number = 10
  ): Promise<KnowledgeBaseEntry[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('knowledge_base')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .order('priority', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error({ error, organizationId, limit }, 'Error getting popular entries');
        return [];
      }

      return data as KnowledgeBaseEntry[];
    } catch (error) {
      logger.error({ error, organizationId, limit }, 'Error getting popular entries');
      return [];
    }
  }

  /**
   * Busca entradas por categoria
   */
  async getEntriesByCategory(
    organizationId: string,
    category: KnowledgeBaseCategory
  ): Promise<KnowledgeBaseEntry[]> {
    return this.listEntries(organizationId, {
      category,
      active: true
    });
  }

  /**
   * Sugere resposta baseada no Knowledge Base usando IA
   */
  async suggestAnswer(
    organizationId: string,
    question: string
  ): Promise<SuggestedAnswer | null> {
    try {
      const searchResults = await this.searchKnowledge(organizationId, question, 3);

      if (searchResults.length > 0 && searchResults[0].relevance_score >= 70) {
        const topResult = searchResults[0];
        await this.incrementUsage(topResult.entry.id);

        return {
          answer: topResult.entry.answer,
          confidence: topResult.relevance_score / 100,
          source_entries: [topResult.entry],
          generated_by: 'kb_match'
        };
      }

      if (searchResults.length > 0 && searchResults[0].relevance_score >= 40) {
        const context = searchResults
          .map(r => `Q: ${r.entry.question}\nA: ${r.entry.answer}`)
          .join('\n\n');

        const systemPrompt = `Você é um assistente de atendimento ao cliente de uma petshop/clínica veterinária.
Com base no contexto da base de conhecimento abaixo, responda à pergunta do cliente de forma clara, objetiva e amigável.

BASE DE CONHECIMENTO:
${context}

INSTRUÇÕES:
- Use as informações da base de conhecimento para responder
- Se a resposta não estiver explícita, sintetize uma resposta coerente baseada no contexto
- Mantenha o tom profissional mas amigável
- Seja breve e direto
- Se não houver informação suficiente, indique isso claramente`;

        const completion = await openai.chat.completions.create({
          model: AI_MODELS.CLIENT,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          temperature: 0.7,
          max_tokens: 300
        });

        const aiAnswer = completion.choices[0]?.message?.content;

        if (aiAnswer) {
          for (const result of searchResults) {
            await this.incrementUsage(result.entry.id);
          }

          return {
            answer: aiAnswer,
            confidence: 0.7,
            source_entries: searchResults.map(r => r.entry),
            generated_by: 'ai_generated'
          };
        }
      }

      return null;
    } catch (error) {
      logger.error({ error, organizationId, question }, 'Error suggesting answer');
      return null;
    }
  }

  /**
   * Estatísticas do Knowledge Base
   */
  async getStats(organizationId: string): Promise<{
    total_entries: number;
    active_entries: number;
    entries_by_category: Record<string, number>;
    entries_by_source: Record<string, number>;
    total_usage: number;
    avg_priority: number;
  }> {
    try {
      const entries = await this.listEntries(organizationId);
      const activeEntries = entries.filter(e => e.is_active);

      const entriesByCategory = entries.reduce((acc, entry) => {
        const cat = entry.category || 'geral';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const entriesBySource = entries.reduce((acc, entry) => {
        const src = entry.source || 'unknown';
        acc[src] = (acc[src] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalUsage = entries.reduce((sum, entry) => sum + (entry.usage_count || 0), 0);
      const avgPriority = entries.length > 0
        ? entries.reduce((sum, entry) => sum + (entry.priority || 0), 0) / entries.length
        : 0;

      return {
        total_entries: entries.length,
        active_entries: activeEntries.length,
        entries_by_category: entriesByCategory,
        entries_by_source: entriesBySource,
        total_usage: totalUsage,
        avg_priority: Math.round(avgPriority * 100) / 100
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error getting knowledge base stats');
      return {
        total_entries: 0,
        active_entries: 0,
        entries_by_category: {},
        entries_by_source: {},
        total_usage: 0,
        avg_priority: 0
      };
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
