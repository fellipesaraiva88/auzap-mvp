import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { TablesInsert, Tables } from '../../types/database.types.js';

export interface DaycareStayInput {
  organizationId: string;
  petId: string;
  contactId: string;
  healthAssessment: {
    vacinas: boolean;
    vermifugo: boolean;
    exames?: string[];
    restricoes_alimentares?: string[];
  };
  behaviorAssessment: {
    socializacao: string;
    ansiedade: string;
    energia: string;
    teste_adaptacao?: string;
  };
  stayType: 'daycare' | 'hotel';
  checkInDate: string; // YYYY-MM-DD
  checkOutDate?: string;
  extraServices?: string[];
  notes?: string;
}

export interface UpsellSuggestion {
  service: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  price_cents?: number;
}

/**
 * DaycareService - Gerenciamento de Estadias (Creche/Hotel)
 *
 * FLUXO:
 * 1. IA coleta avaliações (health + behavior)
 * 2. Service valida documentação
 * 3. Status: aguardando_avaliacao → aprovado → em_estadia → finalizado
 * 4. Upsell: oferece serviços complementares no momento certo
 */
export class DaycareService {
  /**
   * Criar nova estadia
   */
  static async createStay(input: DaycareStayInput): Promise<Tables<'daycare_hotel_stays'>> {
    try {
      logger.info({
        organizationId: input.organizationId,
        petId: input.petId,
        stayType: input.stayType
      }, 'Creating daycare/hotel stay');

      const stayData: TablesInsert<'daycare_hotel_stays'> = {
        organization_id: input.organizationId,
        pet_id: input.petId,
        contact_id: input.contactId,
        health_assessment: input.healthAssessment,
        behavior_assessment: input.behaviorAssessment,
        stay_type: input.stayType,
        check_in_date: input.checkInDate,
        check_out_date: input.checkOutDate,
        extra_services: input.extraServices || [],
        status: input.healthAssessment.vacinas && input.healthAssessment.vermifugo
          ? 'aprovado'
          : 'aguardando_avaliacao', // Auto-aprovar se documentação OK
        notes: input.notes
      };

      const { data, error } = await supabaseAdmin
        .from('daycare_hotel_stays')
        .insert(stayData)
        .select(`
          *,
          pet:pets(*),
          contact:contacts(*)
        `)
        .single();

      if (error) {
        logger.error({ error }, 'Error creating stay');
        throw error;
      }

      logger.info({ stayId: data.id }, 'Stay created successfully');
      return data as Tables<'daycare_hotel_stays'>;
    } catch (error) {
      logger.error({ error }, 'Failed to create stay');
      throw error;
    }
  }

  /**
   * Buscar estadia por ID
   */
  static async getStay(
    stayId: string,
    organizationId: string
  ): Promise<Tables<'daycare_hotel_stays'> | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('daycare_hotel_stays')
        .select(`
          *,
          pet:pets(
            id,
            name,
            species,
            breed,
            age_years,
            weight_kg
          ),
          contact:contacts(
            id,
            full_name,
            phone_number,
            email
          )
        `)
        .eq('id', stayId)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as Tables<'daycare_hotel_stays'>;
    } catch (error) {
      logger.error({ error, stayId }, 'Error fetching stay');
      throw error;
    }
  }

  /**
   * Listar estadias
   */
  static async listStays(
    organizationId: string,
    options?: {
      status?: string;
      stayType?: 'daycare' | 'hotel';
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      let query = supabaseAdmin
        .from('daycare_hotel_stays')
        .select(`
          *,
          pet:pets(
            id,
            name,
            species
          ),
          contact:contacts(
            id,
            full_name,
            phone_number
          )
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('check_in_date', { ascending: false });

      // Filtros
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.stayType) {
        query = query.eq('stay_type', options.stayType);
      }
      if (options?.startDate) {
        query = query.gte('check_in_date', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('check_in_date', options.endDate);
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
        stays: data as Tables<'daycare_hotel_stays'>[],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error listing stays');
      throw error;
    }
  }

  /**
   * Sugerir upsells contextuais
   *
   * LÓGICA DE UPSELL:
   * - Banho: sempre sugerido após creche/hotel
   * - Tosa: sugerido para estadias longas (>3 dias)
   * - Treino básico: sugerido se pet tem problemas comportamentais
   * - Exame veterinário: sugerido se vacinas atrasadas
   */
  static async suggestUpsells(stayId: string): Promise<UpsellSuggestion[]> {
    try {
      const stay = await this.getStay(stayId, ''); // Sem validação de org aqui

      if (!stay) {
        return [];
      }

      const suggestions: UpsellSuggestion[] = [];
      const extraServices = stay.extra_services || [];

      // 1. Banho (alta prioridade)
      if (!extraServices.includes('banho')) {
        suggestions.push({
          service: 'banho',
          reason: 'Pet ficará limpo e cheiroso após a diversão 🛁',
          priority: 'high',
          price_cents: 5000 // R$ 50
        });
      }

      // 2. Tosa (média prioridade para hotel longo)
      if (stay.stay_type === 'hotel' && !extraServices.includes('tosa')) {
        const checkIn = new Date(stay.check_in_date);
        const checkOut = stay.check_out_date ? new Date(stay.check_out_date) : null;

        if (checkOut) {
          const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

          if (days >= 3) {
            suggestions.push({
              service: 'tosa',
              reason: `Estadia de ${days} dias - aproveite para deixar seu pet ainda mais bonito ✂️`,
              priority: 'medium',
              price_cents: 8000 // R$ 80
            });
          }
        }
      }

      // 3. Treino básico (média prioridade se tem problemas)
      const behaviorAssessment = stay.behavior_assessment as any;
      if (behaviorAssessment?.ansiedade === 'alta' || behaviorAssessment?.socializacao === 'baixa') {
        if (!extraServices.includes('treino_basico')) {
          suggestions.push({
            service: 'treino_basico',
            reason: 'Aproveite a estadia para trabalhar comportamento e socialização 🎓',
            priority: 'medium',
            price_cents: 15000 // R$ 150
          });
        }
      }

      // 4. Exame veterinário (alta prioridade se vacinas atrasadas)
      const healthAssessment = stay.health_assessment as any;
      if (!healthAssessment?.vacinas) {
        suggestions.push({
          service: 'exame_veterinario',
          reason: 'Vacinas pendentes - aproveite para regularizar a saúde do seu pet 💉',
          priority: 'high',
          price_cents: 20000 // R$ 200
        });
      }

      // Ordenar por prioridade
      return suggestions.sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
      });
    } catch (error) {
      logger.error({ error, stayId }, 'Error generating upsell suggestions');
      return [];
    }
  }

  /**
   * Atualizar estadia
   */
  static async updateStay(
    stayId: string,
    organizationId: string,
    updates: {
      status?: 'aguardando_avaliacao' | 'aprovado' | 'em_estadia' | 'finalizado' | 'cancelado';
      extraServices?: string[];
      checkOutDate?: string;
      notes?: string;
    }
  ): Promise<Tables<'daycare_hotel_stays'>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('daycare_hotel_stays')
        .update(updates)
        .eq('id', stayId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({ stayId }, 'Stay updated successfully');
      return data as Tables<'daycare_hotel_stays'>;
    } catch (error) {
      logger.error({ error, stayId }, 'Error updating stay');
      throw error;
    }
  }

  /**
   * Adicionar serviço extra (upsell aceito)
   */
  static async addExtraService(
    stayId: string,
    organizationId: string,
    service: string
  ): Promise<Tables<'daycare_hotel_stays'>> {
    try {
      const stay = await this.getStay(stayId, organizationId);

      if (!stay) {
        throw new Error('Stay not found');
      }

      const currentServices = stay.extra_services || [];

      if (currentServices.includes(service)) {
        logger.warn({ stayId, service }, 'Service already added');
        return stay;
      }

      return await this.updateStay(stayId, organizationId, {
        extraServices: [...currentServices, service]
      });
    } catch (error) {
      logger.error({ error, stayId, service }, 'Error adding extra service');
      throw error;
    }
  }
}

export const daycareService = new DaycareService();
