import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

export class PetsService {
  /**
   * Criar novo pet
   */
  static async createPet(data: {
    organization_id: string;
    contact_id: string;
    name: string;
    species?: string;
    breed?: string;
    age?: number;
    weight?: number;
    color?: string;
    notes?: string;
    medical_conditions?: string;
  }) {
    try {
      const { data: pet, error } = await supabase
        .from('pets')
        .insert({
          ...data,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info({ petId: pet.id, contactId: data.contact_id }, 'Pet created');
      return pet;
    } catch (error) {
      logger.error({ error }, 'Error creating pet');
      throw error;
    }
  }

  /**
   * Buscar pet por ID
   */
  static async getPetById(organizationId: string, petId: string) {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*, contact:contacts(*)')
        .eq('organization_id', organizationId)
        .eq('id', petId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ error, petId }, 'Error getting pet');
      throw error;
    }
  }

  /**
   * Listar pets de um contato
   */
  static async getPetsByContact(organizationId: string, contactId: string) {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('contact_id', contactId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ error, contactId }, 'Error getting pets by contact');
      throw error;
    }
  }

  /**
   * Listar todos os pets
   */
  static async listPets(
    organizationId: string,
    filters?: {
      species?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      let query = supabase
        .from('pets')
        .select('*, contact:contacts(name, phone)', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.species) {
        query = query.eq('species', filters.species);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,breed.ilike.%${filters.search}%`
        );
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { pets: data, total: count };
    } catch (error) {
      logger.error({ error }, 'Error listing pets');
      throw error;
    }
  }

  /**
   * Atualizar pet
   */
  static async updatePet(
    organizationId: string,
    petId: string,
    updates: {
      name?: string;
      species?: string;
      breed?: string;
      age?: number;
      weight?: number;
      color?: string;
      notes?: string;
      medical_conditions?: string;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('pets')
        .update(updates)
        .eq('organization_id', organizationId)
        .eq('id', petId)
        .select()
        .single();

      if (error) throw error;

      logger.info({ petId }, 'Pet updated');
      return data;
    } catch (error) {
      logger.error({ error, petId }, 'Error updating pet');
      throw error;
    }
  }

  /**
   * Deletar pet (soft delete)
   */
  static async deletePet(organizationId: string, petId: string) {
    try {
      const { error } = await supabase
        .from('pets')
        .update({ is_active: false })
        .eq('organization_id', organizationId)
        .eq('id', petId);

      if (error) throw error;

      logger.info({ petId }, 'Pet deleted');
      return { success: true };
    } catch (error) {
      logger.error({ error, petId }, 'Error deleting pet');
      throw error;
    }
  }

  /**
   * Buscar pets que precisam de serviço
   */
  static async getPetsNeedingService(
    organizationId: string,
    serviceType: string,
    daysSinceLastService: number = 30
  ) {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysSinceLastService);

      // Buscar pets que não têm agendamento recente do tipo especificado
      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          contact:contacts(*),
          bookings!left(
            created_at,
            service:services(service_type)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (error) throw error;

      // Filtrar pets que não têm serviço recente
      const petsNeeding = data?.filter((pet: any) => {
        const recentBookings = pet.bookings?.filter((booking: any) => 
          booking.service?.service_type === serviceType &&
          new Date(booking.created_at) > dateThreshold
        );
        return !recentBookings || recentBookings.length === 0;
      });

      return petsNeeding;
    } catch (error) {
      logger.error({ error }, 'Error getting pets needing service');
      throw error;
    }
  }
}
