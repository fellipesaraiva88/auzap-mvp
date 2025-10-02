import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import { messageQueue } from '../config/redis';

export class FollowupsService {
  /**
   * Criar follow-up agendado
   */
  static async createFollowup(data: {
    organization_id: string;
    contact_id: string;
    followup_type: string;
    scheduled_for: string;
    message_template: string;
    context_data?: any;
  }) {
    try {
      const { data: followup, error } = await supabase
        .from('scheduled_followups')
        .insert({
          ...data,
          status: 'pending',
        })
        .select('*, contact:contacts(*)')
        .single();

      if (error) throw error;

      logger.info({ followupId: followup.id }, 'Followup scheduled');
      return followup;
    } catch (error) {
      logger.error({ error }, 'Error creating followup');
      throw error;
    }
  }

  /**
   * Buscar follow-ups pendentes
   */
  static async getPendingFollowups(organizationId: string) {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('scheduled_followups')
        .select('*, contact:contacts(*)')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .lte('scheduled_for', now)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ error }, 'Error getting pending followups');
      throw error;
    }
  }

  /**
   * Processar follow-up (enviar mensagem)
   */
  static async processFollowup(followupId: string) {
    try {
      // Buscar follow-up
      const { data: followup, error: fetchError } = await supabase
        .from('scheduled_followups')
        .select('*, contact:contacts(*)')
        .eq('id', followupId)
        .single();

      if (fetchError) throw fetchError;

      if (!followup || followup.status !== 'pending') {
        return { success: false, message: 'Followup not found or not pending' };
      }

      // Renderizar mensagem com contexto
      let message = followup.message_template;
      if (followup.context_data) {
        Object.keys(followup.context_data).forEach((key) => {
          message = message.replace(
            new RegExp(`{{${key}}}`, 'g'),
            followup.context_data[key]
          );
        });
      }

      // Adicionar à fila de mensagens
      await messageQueue.add('send-followup', {
        organizationId: followup.organization_id,
        contactPhone: followup.contact.phone,
        message,
        followupId: followup.id,
      });

      // Atualizar status
      await supabase
        .from('scheduled_followups')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', followupId);

      logger.info({ followupId }, 'Followup processed');
      return { success: true, message: 'Followup sent' };
    } catch (error) {
      logger.error({ error, followupId }, 'Error processing followup');

      // Marcar como falha
      await supabase
        .from('scheduled_followups')
        .update({ status: 'failed' })
        .eq('id', followupId);

      throw error;
    }
  }

  /**
   * Agendar lembrete de consulta
   */
  static async scheduleBookingReminder(
    organizationId: string,
    contactId: string,
    bookingId: string,
    bookingDate: string
  ) {
    try {
      // Agendar para 24h antes da consulta
      const reminderDate = new Date(bookingDate);
      reminderDate.setDate(reminderDate.getDate() - 1);

      const { data: booking } = await supabase
        .from('bookings')
        .select('*, pet:pets(name), service:services(name)')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        throw new Error('Booking not found');
      }

      const message = `🔔 Lembrete: Você tem um agendamento amanhã!\n\n` +
        `📅 ${new Date(bookingDate).toLocaleDateString('pt-BR')}\n` +
        `🐾 Pet: ${booking.pet.name}\n` +
        `💼 Serviço: ${booking.service.name}\n\n` +
        `Qualquer dúvida, estamos à disposição!`;

      return await this.createFollowup({
        organization_id: organizationId,
        contact_id: contactId,
        followup_type: 'booking_reminder',
        scheduled_for: reminderDate.toISOString(),
        message_template: message,
        context_data: {
          booking_id: bookingId,
          pet_name: booking.pet.name,
          service_name: booking.service.name,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Error scheduling booking reminder');
      throw error;
    }
  }

  /**
   * Agendar campanha de reativação
   */
  static async scheduleReactivationCampaign(
    organizationId: string,
    contactId: string,
    daysSinceLastContact: number
  ) {
    try {
      const { data: contact } = await supabase
        .from('contacts')
        .select('*, pets(*)')
        .eq('id', contactId)
        .single();

      if (!contact) {
        throw new Error('Contact not found');
      }

      const petName = contact.pets?.[0]?.name || 'seu pet';

      const message = `Olá! 😊\n\n` +
        `Sentimos sua falta! ${petName} está precisando de algum cuidado?\n\n` +
        `Temos horários disponíveis essa semana. ` +
        `Me diga se posso ajudar em algo!`;

      // Agendar para próximo dia útil
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + 1);
      scheduledFor.setHours(10, 0, 0, 0);

      return await this.createFollowup({
        organization_id: organizationId,
        contact_id: contactId,
        followup_type: 'reactivation',
        scheduled_for: scheduledFor.toISOString(),
        message_template: message,
        context_data: {
          pet_name: petName,
          days_inactive: daysSinceLastContact,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Error scheduling reactivation campaign');
      throw error;
    }
  }

  /**
   * Cancelar follow-up
   */
  static async cancelFollowup(organizationId: string, followupId: string) {
    try {
      const { error } = await supabase
        .from('scheduled_followups')
        .update({ status: 'cancelled' })
        .eq('organization_id', organizationId)
        .eq('id', followupId);

      if (error) throw error;

      logger.info({ followupId }, 'Followup cancelled');
      return { success: true };
    } catch (error) {
      logger.error({ error, followupId }, 'Error cancelling followup');
      throw error;
    }
  }

  /**
   * Listar follow-ups
   */
  static async listFollowups(
    organizationId: string,
    filters?: {
      status?: string;
      followup_type?: string;
      contact_id?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      let query = supabase
        .from('scheduled_followups')
        .select('*, contact:contacts(name, phone)', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('scheduled_for', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.followup_type) {
        query = query.eq('followup_type', filters.followup_type);
      }

      if (filters?.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { followups: data, total: count };
    } catch (error) {
      logger.error({ error }, 'Error listing followups');
      throw error;
    }
  }
}
