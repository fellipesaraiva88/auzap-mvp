import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

export class ContactsService {
  /**
   * Criar novo contato
   */
  static async createContact(data: {
    organization_id: string;
    phone: string;
    name?: string;
    email?: string;
    notes?: string;
  }) {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          ...data,
          status: 'active',
          last_contact_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      logger.info({ contactId: contact.id }, 'Contact created');
      return contact;
    } catch (error) {
      logger.error({ error }, 'Error creating contact');
      throw error;
    }
  }

  /**
   * Buscar contato por ID
   */
  static async getContactById(organizationId: string, contactId: string) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, pets(*)')
        .eq('organization_id', organizationId)
        .eq('id', contactId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ error, contactId }, 'Error getting contact');
      throw error;
    }
  }

  /**
   * Buscar contato por telefone
   */
  static async getContactByPhone(organizationId: string, phone: string) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, pets(*)')
        .eq('organization_id', organizationId)
        .eq('phone', phone)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      logger.error({ error, phone }, 'Error getting contact by phone');
      throw error;
    }
  }

  /**
   * Listar contatos com filtros
   */
  static async listContacts(
    organizationId: string,
    filters?: {
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      let query = supabase
        .from('contacts')
        .select('*, pets(count)', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('last_contact_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
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

      return { contacts: data, total: count };
    } catch (error) {
      logger.error({ error }, 'Error listing contacts');
      throw error;
    }
  }

  /**
   * Atualizar contato
   */
  static async updateContact(
    organizationId: string,
    contactId: string,
    updates: {
      name?: string;
      email?: string;
      notes?: string;
      status?: string;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('organization_id', organizationId)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;

      logger.info({ contactId }, 'Contact updated');
      return data;
    } catch (error) {
      logger.error({ error, contactId }, 'Error updating contact');
      throw error;
    }
  }

  /**
   * Deletar contato (soft delete)
   */
  static async deleteContact(organizationId: string, contactId: string) {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status: 'inactive' })
        .eq('organization_id', organizationId)
        .eq('id', contactId);

      if (error) throw error;

      logger.info({ contactId }, 'Contact deleted');
      return { success: true };
    } catch (error) {
      logger.error({ error, contactId }, 'Error deleting contact');
      throw error;
    }
  }

  /**
   * Buscar contatos inativos
   */
  static async getInactiveContacts(organizationId: string, daysInactive: number = 60) {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysInactive);

      const { data, error } = await supabase
        .from('contacts')
        .select('*, pets(*)')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .lt('last_contact_at', dateThreshold.toISOString())
        .order('last_contact_at', { ascending: true });

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error({ error }, 'Error getting inactive contacts');
      throw error;
    }
  }
}
