import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

export class ServicesService {
  /**
   * Criar novo serviço
   */
  static async createService(data: {
    organization_id: string;
    name: string;
    service_type: string;
    description?: string;
    duration_minutes?: number;
    price?: number;
  }) {
    try {
      const { data: service, error } = await supabase
        .from('services')
        .insert({
          ...data,
          duration_minutes: data.duration_minutes || 60,
          price: data.price || 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info({ serviceId: service.id }, 'Service created');
      return service;
    } catch (error) {
      logger.error({ error }, 'Error creating service');
      throw error;
    }
  }

  /**
   * Buscar serviço por ID
   */
  static async getServiceById(organizationId: string, serviceId: string) {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ error, serviceId }, 'Error getting service');
      throw error;
    }
  }

  /**
   * Listar serviços
   */
  static async listServices(
    organizationId: string,
    filters?: {
      service_type?: string;
      is_active?: boolean;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      let query = supabase
        .from('services')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (filters?.service_type) {
        query = query.eq('service_type', filters.service_type);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
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

      return { services: data, total: count };
    } catch (error) {
      logger.error({ error }, 'Error listing services');
      throw error;
    }
  }

  /**
   * Atualizar serviço
   */
  static async updateService(
    organizationId: string,
    serviceId: string,
    updates: {
      name?: string;
      service_type?: string;
      description?: string;
      duration_minutes?: number;
      price?: number;
      is_active?: boolean;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('organization_id', organizationId)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;

      logger.info({ serviceId }, 'Service updated');
      return data;
    } catch (error) {
      logger.error({ error, serviceId }, 'Error updating service');
      throw error;
    }
  }

  /**
   * Deletar serviço (soft delete)
   */
  static async deleteService(organizationId: string, serviceId: string) {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('organization_id', organizationId)
        .eq('id', serviceId);

      if (error) throw error;

      logger.info({ serviceId }, 'Service deleted');
      return { success: true };
    } catch (error) {
      logger.error({ error, serviceId }, 'Error deleting service');
      throw error;
    }
  }

  /**
   * Buscar serviços mais populares
   */
  static async getPopularServices(
    organizationId: string,
    dateFrom?: string,
    dateTo?: string,
    limit: number = 10
  ) {
    try {
      // Buscar serviços com contagem de agendamentos
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          bookings:bookings(count)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (error) throw error;

      // Se há filtro de data, buscar agendamentos separadamente
      if (dateFrom && dateTo) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('service_id')
          .eq('organization_id', organizationId)
          .gte('scheduled_date', dateFrom)
          .lte('scheduled_date', dateTo);

        if (bookingsError) throw bookingsError;

        // Contar bookings por serviço
        const bookingCounts = bookings.reduce((acc: Record<string, number>, booking: any) => {
          acc[booking.service_id] = (acc[booking.service_id] || 0) + 1;
          return acc;
        }, {});

        // Adicionar contagem aos serviços e ordenar
        const servicesWithCount = data.map((service: any) => ({
          ...service,
          booking_count: bookingCounts[service.id] || 0,
        }));

        return servicesWithCount
          .sort((a, b) => b.booking_count - a.booking_count)
          .slice(0, limit);
      }

      // Ordenar por contagem de bookings total
      return data
        .map((service: any) => ({
          ...service,
          booking_count: service.bookings?.[0]?.count || 0,
        }))
        .sort((a, b) => b.booking_count - a.booking_count)
        .slice(0, limit);
    } catch (error) {
      logger.error({ error }, 'Error getting popular services');
      throw error;
    }
  }

  /**
   * Calcular receita por serviço
   */
  static async getServiceRevenue(
    organizationId: string,
    dateFrom: string,
    dateTo: string
  ) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('service_id, actual_amount, service:services(name, service_type)')
        .eq('organization_id', organizationId)
        .gte('scheduled_date', dateFrom)
        .lte('scheduled_date', dateTo)
        .in('status', ['completed', 'confirmed']);

      if (error) throw error;

      const revenue: Record<string, { name: string; type: string; total: number; count: number }> = {};

      data.forEach((booking: any) => {
        const serviceId = booking.service_id;
        if (!revenue[serviceId]) {
          revenue[serviceId] = {
            name: booking.service?.name || 'Unknown',
            type: booking.service?.service_type || 'other',
            total: 0,
            count: 0,
          };
        }
        revenue[serviceId].total += booking.actual_amount || 0;
        revenue[serviceId].count += 1;
      });

      return Object.entries(revenue).map(([serviceId, data]) => ({
        service_id: serviceId,
        ...data,
        average: data.count > 0 ? data.total / data.count : 0,
      }));
    } catch (error) {
      logger.error({ error }, 'Error getting service revenue');
      throw error;
    }
  }
}
