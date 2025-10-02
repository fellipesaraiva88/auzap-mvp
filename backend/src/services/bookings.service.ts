import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

export class BookingsService {
  /**
   * Criar novo agendamento
   */
  static async createBooking(data: {
    organization_id: string;
    contact_id: string;
    pet_id: string;
    service_id: string;
    scheduled_date: string;
    duration_minutes?: number;
    notes?: string;
  }) {
    try {
      // Verificar disponibilidade
      const isAvailable = await this.checkAvailability(
        data.organization_id,
        data.scheduled_date,
        data.duration_minutes || 60
      );

      if (!isAvailable) {
        throw new Error('Horário não disponível');
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          ...data,
          status: 'scheduled',
        })
        .select('*, pet:pets(*), contact:contacts(*), service:services(*)')
        .single();

      if (error) throw error;

      logger.info({ bookingId: booking.id }, 'Booking created');
      return booking;
    } catch (error) {
      logger.error({ error }, 'Error creating booking');
      throw error;
    }
  }

  /**
   * Verificar disponibilidade
   */
  static async checkAvailability(
    organizationId: string,
    scheduledDate: string,
    durationMinutes: number = 60
  ): Promise<boolean> {
    try {
      const startTime = new Date(scheduledDate);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

      // Buscar agendamentos no mesmo horário
      const { data, error } = await supabase
        .from('bookings')
        .select('id, scheduled_date, duration_minutes')
        .eq('organization_id', organizationId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_date', startTime.toISOString())
        .lte('scheduled_date', endTime.toISOString());

      if (error) throw error;

      // Se não há conflitos, está disponível
      return !data || data.length === 0;
    } catch (error) {
      logger.error({ error }, 'Error checking availability');
      return false;
    }
  }

  /**
   * Buscar agendamento por ID
   */
  static async getBookingById(organizationId: string, bookingId: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, pet:pets(*), contact:contacts(*), service:services(*)')
        .eq('organization_id', organizationId)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ error, bookingId }, 'Error getting booking');
      throw error;
    }
  }

  /**
   * Listar agendamentos
   */
  static async listBookings(
    organizationId: string,
    filters?: {
      status?: string;
      pet_id?: string;
      contact_id?: string;
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      let query = supabase
        .from('bookings')
        .select(
          '*, pet:pets(name, species), contact:contacts(name, phone), service:services(name, service_type)',
          { count: 'exact' }
        )
        .eq('organization_id', organizationId)
        .order('scheduled_date', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.pet_id) {
        query = query.eq('pet_id', filters.pet_id);
      }

      if (filters?.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }

      if (filters?.date_from) {
        query = query.gte('scheduled_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('scheduled_date', filters.date_to);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { bookings: data, total: count };
    } catch (error) {
      logger.error({ error }, 'Error listing bookings');
      throw error;
    }
  }

  /**
   * Atualizar agendamento
   */
  static async updateBooking(
    organizationId: string,
    bookingId: string,
    updates: {
      scheduled_date?: string;
      duration_minutes?: number;
      status?: string;
      notes?: string;
      actual_amount?: number;
    }
  ) {
    try {
      // Se mudou data, verificar disponibilidade
      if (updates.scheduled_date) {
        const isAvailable = await this.checkAvailability(
          organizationId,
          updates.scheduled_date,
          updates.duration_minutes || 60
        );

        if (!isAvailable) {
          throw new Error('Horário não disponível');
        }
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('organization_id', organizationId)
        .eq('id', bookingId)
        .select('*, pet:pets(*), contact:contacts(*), service:services(*)')
        .single();

      if (error) throw error;

      logger.info({ bookingId }, 'Booking updated');
      return data;
    } catch (error) {
      logger.error({ error, bookingId }, 'Error updating booking');
      throw error;
    }
  }

  /**
   * Cancelar agendamento
   */
  static async cancelBooking(organizationId: string, bookingId: string, reason?: string) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          notes: reason ? `Cancelado: ${reason}` : 'Cancelado',
        })
        .eq('organization_id', organizationId)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      logger.info({ bookingId }, 'Booking cancelled');
      return data;
    } catch (error) {
      logger.error({ error, bookingId }, 'Error cancelling booking');
      throw error;
    }
  }

  /**
   * Buscar horários disponíveis
   */
  static async getAvailableSlots(
    organizationId: string,
    date: string,
    durationMinutes: number = 60
  ) {
    try {
      // Horário de funcionamento: 8h às 18h
      const businessStart = 8;
      const businessEnd = 18;
      const slotDuration = durationMinutes;

      const slots: { start: string; end: string; available: boolean }[] = [];

      for (let hour = businessStart; hour < businessEnd; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);

        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

        if (slotEnd.getHours() <= businessEnd) {
          const isAvailable = await this.checkAvailability(
            organizationId,
            slotStart.toISOString(),
            slotDuration
          );

          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            available: isAvailable,
          });
        }
      }

      return slots;
    } catch (error) {
      logger.error({ error }, 'Error getting available slots');
      throw error;
    }
  }

  /**
   * Analytics de agendamentos
   */
  static async getBookingAnalytics(
    organizationId: string,
    dateFrom: string,
    dateTo: string
  ) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('status, actual_amount, service:services(service_type, name)')
        .eq('organization_id', organizationId)
        .gte('scheduled_date', dateFrom)
        .lte('scheduled_date', dateTo);

      if (error) throw error;

      const analytics = {
        total: data.length,
        by_status: {} as Record<string, number>,
        by_service: {} as Record<string, number>,
        revenue: data
          .filter((b) => b.actual_amount)
          .reduce((sum, b) => sum + (b.actual_amount || 0), 0),
      };

      data.forEach((booking) => {
        // Por status
        analytics.by_status[booking.status] = 
          (analytics.by_status[booking.status] || 0) + 1;

        // Por tipo de serviço
        const serviceType = booking.service?.service_type || 'outros';
        analytics.by_service[serviceType] = 
          (analytics.by_service[serviceType] || 0) + 1;
      });

      return analytics;
    } catch (error) {
      logger.error({ error }, 'Error getting booking analytics');
      throw error;
    }
  }
}
