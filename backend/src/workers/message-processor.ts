import { Worker } from 'bullmq';
import { connection } from '../config/redis';
import { supabase } from '../config/supabase';
import { BaileysService } from '../services/baileys.service';
import { AuroraService } from '../services/aurora.service';
import { ClientAIService } from '../services/client-ai.service';
import { detectOwnerNumber } from '../middleware/aurora-auth.middleware';
import { logger } from '../config/logger';

/**
 * Worker para processar mensagens WhatsApp
 */
const worker = new Worker(
  'messages',
  async (job) => {
    const { organizationId, instanceId, message } = job.data;

    try {
      logger.info({ jobId: job.id, organizationId }, 'Processing message');

      // Extrair dados da mensagem
      const from = message.key.remoteJid;
      const messageId = message.key.id;
      const messageType = Object.keys(message.message || {})[0];

      // Conteúdo da mensagem
      let content = '';
      if (messageType === 'conversation') {
        content = message.message.conversation;
      } else if (messageType === 'extendedTextMessage') {
        content = message.message.extendedTextMessage.text;
      }

      if (!content) {
        logger.warn({ messageType }, 'No text content found');
        return { success: true, skipped: true };
      }

      // Limpar número do remetente
      const cleanFrom = from.split('@')[0];

      // Detectar se é dono ou cliente
      const auroraContext = await detectOwnerNumber(cleanFrom, organizationId);

      let response: string;
      let isOwnerMessage = false;

      if (auroraContext.isOwner) {
        // ===== PROCESSAMENTO AURORA =====
        logger.info(
          {
            from: cleanFrom,
            type: 'OWNER',
            agentType: 'aurora',
            userId: auroraContext.userId,
            messageContent: content.substring(0, 50),
          },
          '[AURORA] Processing owner message'
        );
        isOwnerMessage = true;

        response = await AuroraService.processOwnerMessage({
          organizationId,
          ownerNumberId: auroraContext.ownerNumberId!,
          content,
          context: auroraContext,
        });

        // Salvar mensagem proativa
        await supabase.from('aurora_proactive_messages').insert({
          organization_id: organizationId,
          owner_number_id: auroraContext.ownerNumberId,
          message_type: 'custom',
          content: response,
          scheduled_for: new Date().toISOString(),
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        logger.info(
          {
            from: cleanFrom,
            agentType: 'aurora',
            responseLength: response.length,
          },
          '[AURORA] Response sent successfully'
        );
      } else {
        // ===== PROCESSAMENTO IA CLIENTE =====
        logger.info(
          {
            from: cleanFrom,
            type: 'CLIENT',
            agentType: 'client-ai',
            messageContent: content.substring(0, 50),
          },
          '[CLIENT-AI] Processing client message'
        );

        // Buscar ou criar contato
        const { data: contact } = await supabase
          .from('contacts')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('phone', cleanFrom)
          .single();

        let contactId: string;

        if (!contact) {
          const { data: newContact, error } = await supabase
            .from('contacts')
            .insert({
              organization_id: organizationId,
              phone: cleanFrom,
              name: cleanFrom,
              status: 'active',
              last_contact_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          contactId = newContact.id;
        } else {
          contactId = contact.id;

          // Atualizar last_contact_at
          await supabase
            .from('contacts')
            .update({ last_contact_at: new Date().toISOString() })
            .eq('id', contactId);
        }

        // Buscar ou criar conversa
        const { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('contact_id', contactId)
          .eq('status', 'active')
          .single();

        let conversationId: string;

        if (!conversation) {
          const { data: newConversation, error } = await supabase
            .from('conversations')
            .insert({
              organization_id: organizationId,
              contact_id: contactId,
              whatsapp_instance_id: instanceId,
              status: 'active',
              last_message_at: new Date().toISOString(),
              last_message_preview: content.substring(0, 100),
            })
            .select()
            .single();

          if (error) throw error;
          conversationId = newConversation.id;
        } else {
          conversationId = conversation.id;

          // Atualizar conversa
          await supabase
            .from('conversations')
            .update({
              last_message_at: new Date().toISOString(),
              last_message_preview: content.substring(0, 100),
              unread_count: (conversation.unread_count || 0) + 1,
            })
            .eq('id', conversationId);
        }

        // Salvar mensagem recebida
        await supabase.from('messages').insert({
          organization_id: organizationId,
          conversation_id: conversationId,
          whatsapp_message_id: messageId,
          direction: 'incoming',
          content,
          message_type: 'text',
          from_me: false,
        });

        // Processar com IA
        response = await ClientAIService.processClientMessage(
          organizationId,
          contactId,
          conversationId,
          content
        );

        // Salvar resposta da IA
        await supabase.from('messages').insert({
          organization_id: organizationId,
          conversation_id: conversationId,
          direction: 'outgoing',
          content: response,
          message_type: 'text',
          from_me: true,
          sent_by_ai: true,
        });

        logger.info(
          {
            from: cleanFrom,
            agentType: 'client-ai',
            contactId,
            conversationId,
            responseLength: response.length,
          },
          '[CLIENT-AI] Response sent successfully'
        );
      }

      // Enviar resposta via WhatsApp
      await BaileysService.sendMessage(
        organizationId,
        instanceId,
        cleanFrom,
        response
      );

      logger.info({ jobId: job.id }, 'Message processed successfully');

      return {
        success: true,
        isOwner: isOwnerMessage,
        response: response.substring(0, 100),
      };
    } catch (error: unknown) {
      logger.error(
        { error, jobId: job.id, organizationId },
        'Error processing message'
      );
      throw error;
    }
  },
  {
    connection,
    concurrency: process.env.WORKER_CONCURRENCY
      ? parseInt(process.env.WORKER_CONCURRENCY)
      : 5, // Ajustável via env
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
    limiter: {
      max: 10, // Max 10 jobs por segundo
      duration: 1000,
    },
    settings: {
      backoffStrategy: (attemptsMade: number) => {
        // Exponential backoff: 2s, 4s, 8s
        return Math.min(Math.pow(2, attemptsMade) * 1000, 10000);
      },
    },
  }
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, '✅ Job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, '❌ Job failed');
});

export default worker;
