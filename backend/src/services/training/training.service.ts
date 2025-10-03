import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { TablesInsert, Tables } from '../../types/database.types.js';

export interface TrainingPlanInput {
  organizationId: string;
  petId: string;
  contactId: string;
  initialAssessment: {
    rotina: string;
    problemas: string[];
    relacao_familia: string;
    historico_saude: string;
    observacao_pratica: string;
    objetivos: string[];
  };
  planType: '1x_semana' | '2x_semana' | '3x_semana';
  durationWeeks: number;
  methodology?: string;
  locationType?: 'casa_tutor' | 'parque' | 'escola';
}

export interface TrainingPlanUpdate {
  status?: 'em_avaliacao' | 'plano_criado' | 'em_andamento' | 'concluido' | 'cancelado';
  shortTermGoals?: string[];
  longTermGoals?: string[];
  methodology?: string;
  sessionDurationMinutes?: number;
}

/**
 * TrainingService - Gerenciamento de Planos de Adestramento
 *
 * FLUXO:
 * 1. IA coleta avaliação inicial completa (6 pontos)
 * 2. Service cria plano com frequência e duração
 * 3. Status: em_avaliacao → plano_criado → em_andamento → concluido
 */
export class TrainingService {
  /**
   * Criar novo plano de adestramento
   */
  static async createTrainingPlan(input: TrainingPlanInput): Promise<Tables<'training_plans'>> {
    try {
      logger.info({
        organizationId: input.organizationId,
        petId: input.petId
      }, 'Creating training plan');

      // Calcular frequência semanal
      const frequency = {
        '1x_semana': 1,
        '2x_semana': 2,
        '3x_semana': 3
      }[input.planType];

      const planData: TablesInsert<'training_plans'> = {
        organization_id: input.organizationId,
        pet_id: input.petId,
        contact_id: input.contactId,
        initial_assessment: input.initialAssessment,
        plan_type: input.planType,
        duration_weeks: input.durationWeeks,
        session_frequency: frequency,
        methodology: input.methodology || 'reforco_positivo',
        location_type: input.locationType,
        status: 'plano_criado' // Já criado após avaliação
      };

      const { data, error } = await supabaseAdmin
        .from('training_plans')
        .insert(planData)
        .select(`
          *,
          pet:pets(*),
          contact:contacts(*)
        `)
        .single();

      if (error) {
        logger.error({ error }, 'Error creating training plan');
        throw error;
      }

      logger.info({ planId: data.id }, 'Training plan created successfully');
      return data as Tables<'training_plans'>;
    } catch (error) {
      logger.error({ error }, 'Failed to create training plan');
      throw error;
    }
  }

  /**
   * Buscar plano por ID (com joins)
   */
  static async getTrainingPlan(
    planId: string,
    organizationId: string
  ): Promise<Tables<'training_plans'> | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('training_plans')
        .select(`
          *,
          pet:pets(
            id,
            name,
            species,
            breed,
            age_years,
            gender
          ),
          contact:contacts(
            id,
            full_name,
            phone_number,
            email
          )
        `)
        .eq('id', planId)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        throw error;
      }

      return data as Tables<'training_plans'>;
    } catch (error) {
      logger.error({ error, planId }, 'Error fetching training plan');
      throw error;
    }
  }

  /**
   * Listar planos por organização (com paginação e filtros)
   */
  static async listTrainingPlans(
    organizationId: string,
    options?: {
      status?: string;
      petId?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      let query = supabaseAdmin
        .from('training_plans')
        .select(`
          *,
          pet:pets(
            id,
            name,
            species,
            breed
          ),
          contact:contacts(
            id,
            full_name,
            phone_number
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      // Filtros opcionais
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.petId) {
        query = query.eq('pet_id', options.petId);
      }

      // Paginação
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        plans: data as Tables<'training_plans'>[],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error listing training plans');
      throw error;
    }
  }

  /**
   * Atualizar progresso do plano
   */
  static async updateTrainingPlan(
    planId: string,
    organizationId: string,
    updates: TrainingPlanUpdate
  ): Promise<Tables<'training_plans'>> {
    try {
      logger.info({ planId, updates }, 'Updating training plan');

      const updateData: any = {};

      if (updates.status) updateData.status = updates.status;
      if (updates.shortTermGoals) updateData.short_term_goals = updates.shortTermGoals;
      if (updates.longTermGoals) updateData.long_term_goals = updates.longTermGoals;
      if (updates.methodology) updateData.methodology = updates.methodology;
      if (updates.sessionDurationMinutes) updateData.session_duration_minutes = updates.sessionDurationMinutes;

      const { data, error } = await supabaseAdmin
        .from('training_plans')
        .update(updateData)
        .eq('id', planId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({ planId }, 'Training plan updated successfully');
      return data as Tables<'training_plans'>;
    } catch (error) {
      logger.error({ error, planId }, 'Error updating training plan');
      throw error;
    }
  }

  /**
   * Deletar plano (soft delete via status)
   */
  static async cancelTrainingPlan(
    planId: string,
    organizationId: string
  ): Promise<void> {
    try {
      await this.updateTrainingPlan(planId, organizationId, {
        status: 'cancelado'
      });

      logger.info({ planId }, 'Training plan cancelled');
    } catch (error) {
      logger.error({ error, planId }, 'Error cancelling training plan');
      throw error;
    }
  }
}

export const trainingService = new TrainingService();
