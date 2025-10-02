import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

/**
 * Tipos de mensagens suportadas
 */
export type ContentType = 'text' | 'image' | 'audio' | 'video' | 'document';

/**
 * Direção da mensagem
 */
export type MessageDirection = 'incoming' | 'outgoing';

/**
 * Status da conversa
 */
export type ConversationStatus = 'active' | 'closed' | 'archived';

/**
 * Interface para criar mensagem
 */
export interface SavedMessage {
  organization_id: string;
  conversation_id: string;
  whatsapp_message_id?: string;
  direction: MessageDirection;
  content: string;
  message_type: ContentType;
  sender_phone?: string;
  media_url?: string;
  from_me: boolean;
  sent_by_ai?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Interface para criar conversa
 */
export interface CreateConversationData {
  organization_id: string;
  contact_id: string;
  whatsapp_instance_id: string;
  status?: ConversationStatus;
  last_message_at?: string;
  last_message_preview?: string;
}

/**
 * Service para gerenciar conversas e mensagens
 */
export class ConversationsService {
  /**
   * Buscar ou criar conversa ativa para um contato
   */
  static async findOrCreateConversation(
    organizationId: string,
    contactId: string,
    instanceId: string
  ): Promise<any> {
    try {
      // Tentar buscar conversa ativa existente
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('contact_id', contactId)
        .eq('status', 'active')
        .single();

      if (existing) {
        logger.info({ conversationId: existing.id }, 'Found existing conversation');
        return existing;
      }

      // Criar nova conversa
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          organization_id: organizationId,
          contact_id: contactId,
          whatsapp_instance_id: instanceId,
          status: 'active',
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info({ conversationId: newConversation.id }, 'Created new conversation');
      return newConversation;
    } catch (error) {
      logger.error({ error, organizationId, contactId }, 'Error finding/creating conversation');
      throw error;
    }
  }

  /**
   * Salvar mensagem recebida
   */
  static async saveIncomingMessage(
    organizationId: string,
    conversationId: string,
    messageData: {
      whatsapp_message_id: string;
      sender_phone: string;
      content: string;
      content_type?: ContentType;
      media_url?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    try {
      const message: SavedMessage = {
        organization_id: organizationId,
        conversation_id: conversationId,
        whatsapp_message_id: messageData.whatsapp_message_id,
        direction: 'incoming',
        content: messageData.content,
        message_type: messageData.content_type || 'text',
        sender_phone: messageData.sender_phone,
        media_url: messageData.media_url,
        from_me: false,
        sent_by_ai: false,
        metadata: messageData.metadata,
      };

      const { data: savedMessage, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;

      // Atualizar conversa com última mensagem
      await this.updateConversationLastMessage(
        conversationId,
        messageData.content,
        true // incrementar unread_count
      );

      logger.info(
        {
          messageId: savedMessage.id,
          conversationId,
          from: messageData.sender_phone,
        },
        'Incoming message saved'
      );

      return savedMessage;
    } catch (error) {
      logger.error({ error, conversationId }, 'Error saving incoming message');
      throw error;
    }
  }

  /**
   * Salvar mensagem enviada
   */
  static async saveOutgoingMessage(
    organizationId: string,
    conversationId: string,
    messageData: {
      content: string;
      content_type?: ContentType;
      sent_by_ai?: boolean;
      media_url?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    try {
      const message: Partial<SavedMessage> = {
        organization_id: organizationId,
        conversation_id: conversationId,
        direction: 'outgoing',
        content: messageData.content,
        message_type: messageData.content_type || 'text',
        media_url: messageData.media_url,
        from_me: true,
        sent_by_ai: messageData.sent_by_ai || false,
        metadata: messageData.metadata,
      };

      const { data: savedMessage, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;

      // Atualizar conversa com última mensagem (não incrementa unread)
      await this.updateConversationLastMessage(conversationId, messageData.content, false);

      logger.info(
        {
          messageId: savedMessage.id,
          conversationId,
          sentByAI: messageData.sent_by_ai,
        },
        'Outgoing message saved'
      );

      return savedMessage;
    } catch (error) {
      logger.error({ error, conversationId }, 'Error saving outgoing message');
      throw error;
    }
  }

  /**
   * Atualizar última mensagem da conversa
   */
  static async updateConversationLastMessage(
    conversationId: string,
    content: string,
    incrementUnread: boolean = false
  ): Promise<void> {
    try {
      const updates: any = {
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100),
      };

      if (incrementUnread) {
        // Usar função RPC para incrementar atomicamente
        const { data: conversation } = await supabase
          .from('conversations')
          .select('unread_count')
          .eq('id', conversationId)
          .single();

        updates.unread_count = (conversation?.unread_count || 0) + 1;
      }

      const { error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversationId);

      if (error) throw error;
    } catch (error) {
      logger.error({ error, conversationId }, 'Error updating conversation');
      throw error;
    }
  }

  /**
   * Marcar conversa como lida
   */
  static async markAsRead(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);

      if (error) throw error;

      logger.info({ conversationId }, 'Conversation marked as read');
    } catch (error) {
      logger.error({ error, conversationId }, 'Error marking conversation as read');
      throw error;
    }
  }

  /**
   * Fechar conversa
   */
  static async closeConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'closed' })
        .eq('id', conversationId);

      if (error) throw error;

      logger.info({ conversationId }, 'Conversation closed');
    } catch (error) {
      logger.error({ error, conversationId }, 'Error closing conversation');
      throw error;
    }
  }

  /**
   * Arquivar conversa
   */
  static async archiveConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', conversationId);

      if (error) throw error;

      logger.info({ conversationId }, 'Conversation archived');
    } catch (error) {
      logger.error({ error, conversationId }, 'Error archiving conversation');
      throw error;
    }
  }

  /**
   * Listar conversas de uma organização
   */
  static async listConversations(
    organizationId: string,
    filters?: {
      status?: ConversationStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ conversations: any[]; total: number }> {
    try {
      let query = supabase
        .from('conversations')
        .select(
          `
          *,
          contact:contacts(*),
          whatsapp_instance:whatsapp_instances(*)
        `,
          { count: 'exact' }
        )
        .eq('organization_id', organizationId)
        .order('last_message_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 10) - 1
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { conversations: data || [], total: count || 0 };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error listing conversations');
      throw error;
    }
  }

  /**
   * Buscar mensagens de uma conversa
   */
  static async getConversationMessages(
    conversationId: string,
    filters?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ messages: any[]; total: number }> {
    try {
      let query = supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 50) - 1
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { messages: data || [], total: count || 0 };
    } catch (error) {
      logger.error({ error, conversationId }, 'Error getting conversation messages');
      throw error;
    }
  }

  /**
   * Buscar conversa por ID
   */
  static async getConversationById(
    organizationId: string,
    conversationId: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          *,
          contact:contacts(*),
          whatsapp_instance:whatsapp_instances(*)
        `
        )
        .eq('organization_id', organizationId)
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error({ error, conversationId }, 'Error getting conversation');
      throw error;
    }
  }
}
