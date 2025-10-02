import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { supabaseAdmin } from '../config/supabase.js';
import type { TablesInsert, Tables } from '../types/database.types.js';
import { clientAIService } from '../services/ai/client-ai.service.js';
import { auroraService } from '../services/aurora/aurora.service.js';
import { contactsService } from '../services/contacts/contacts.service.js';
import { baileysService } from '../services/baileys/baileys.service.js';
import { contextBuilderService } from '../services/context/context-builder.service.js';

interface MessageJob {
  organizationId: string;
  instanceId: string;
  from: string;
  content: string;
  messageId?: string;
  timestamp?: number;
}

/**
 * Worker para processar mensagens WhatsApp
 * Detecta se é cliente ou dono e roteia para IA apropriada
 */
export class MessageProcessorWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'message-processing',
      async (job: Job<MessageJob>) => await this.processMessage(job),
      {
        connection: redisConnection,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000 // 10 mensagens por segundo
        }
      }
    );

    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id }, 'Message processed successfully');
    });

    this.worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, error: err }, 'Message processing failed');
    });

    logger.info('Message processor worker started');
  }

  private async processMessage(job: Job<MessageJob>): Promise<void> {
    const { organizationId, instanceId, from, content } = job.data;

    try {
      logger.info({ organizationId, from }, 'Processing incoming message');

      // Extrair número de telefone limpo
      const phoneNumber = from.split('@')[0];

      // Verificar se é número de dono autorizado
      const isOwner = await this.checkIfOwner(organizationId, phoneNumber);

      if (isOwner) {
        // Processar com Aurora (IA do Dono)
        await this.processOwnerMessage(organizationId, instanceId, phoneNumber, content);
      } else {
        // Processar com IA Cliente
        await this.processClientMessage(organizationId, instanceId, phoneNumber, from, content);
      }
    } catch (error) {
      logger.error({ error, job: job.data }, 'Error processing message');
      throw error; // Retry via BullMQ
    }
  }

  /**
   * Verifica se número é de dono autorizado
   */
  private async checkIfOwner(organizationId: string, phoneNumber: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('phone_number', phoneNumber)
      .eq('is_active', true)
      .single();

    return !!data && !error;
  }

  /**
   * Processa mensagem de dono (Aurora)
   */
  private async processOwnerMessage(
    organizationId: string,
    instanceId: string,
    phoneNumber: string,
    content: string
  ): Promise<void> {
    logger.info({ organizationId, phoneNumber }, 'Processing as owner message (Aurora)');

    // Buscar dados do dono
    const { data: ownerData } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .select('owner_name')
      .eq('organization_id', organizationId)
      .eq('phone_number', phoneNumber)
      .single();

    // Processar com Aurora
    const response = await auroraService.processOwnerMessage(
      {
        organizationId,
        ownerPhone: phoneNumber,
        ownerName: ownerData?.owner_name || 'Dono'
      },
      content
    );

    // Enviar resposta
    await baileysService.sendTextMessage(instanceId, phoneNumber, response);

    // Salvar mensagem no banco
    await this.saveMessage(organizationId, instanceId, phoneNumber, content, response, true);
  }

  /**
   * Processa mensagem de cliente (IA Cliente)
   */
  private async processClientMessage(
    organizationId: string,
    instanceId: string,
    phoneNumber: string,
    jid: string,
    content: string
  ): Promise<void> {
    logger.info({ organizationId, phoneNumber }, 'Processing as client message');

    // Buscar ou criar contato
    const contact = await contactsService.findOrCreateByPhone(
      organizationId,
      phoneNumber,
      instanceId
    );

    // Buscar ou criar conversa
    const conversation = await this.findOrCreateConversation(
      organizationId,
      instanceId,
      contact.id
    );

    // Construir contexto enriquecido (últimas 5 msgs + pets + bookings)
    const clientContext = await contextBuilderService.buildClientContext(
      organizationId,
      contact.id,
      conversation.id
    );

    // Processar com IA Cliente (GPT-4o-mini)
    const response = await clientAIService.processMessage(
      {
        organizationId,
        contactId: contact.id,
        conversationId: conversation.id,
        context: clientContext
      },
      content
    );

    // Enviar resposta
    await baileysService.sendTextMessage(instanceId, jid, response);

    // Salvar mensagens
    await this.saveMessage(organizationId, instanceId, phoneNumber, content, response, false, conversation.id);

    // Atualizar timestamp da conversa
    await supabaseAdmin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);
  }

  /**
   * Busca ou cria conversa
   */
  private async findOrCreateConversation(
    organizationId: string,
    instanceId: string,
    contactId: string
  ): Promise<any> {
    // Buscar conversa ativa
    const { data: existing } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('whatsapp_instance_id', instanceId)
      .eq('contact_id', contactId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return existing;
    }

    // Criar nova conversa
    const convData: TablesInsert<'conversations'> = {
      organization_id: organizationId,
      whatsapp_instance_id: instanceId,
      contact_id: contactId,
      status: 'active',
      last_message_at: new Date().toISOString(),
      tags: []
    };
    const { data: newConv } = await supabaseAdmin
      .from('conversations')
      .insert(convData)
      .select()
      .single() as { data: Tables<'conversations'> | null; error: any };

    return newConv;
  }


  /**
   * Salva mensagens no banco
   */
  private async saveMessage(
    organizationId: string,
    _instanceId: string,
    _phoneNumber: string,
    inboundContent: string,
    outboundContent: string,
    _isOwner: boolean,
    conversationId?: string
  ): Promise<void> {
    const messages: TablesInsert<'messages'>[] = [
      {
        organization_id: organizationId,
        conversation_id: conversationId || '',
        direction: 'inbound',
        content: inboundContent,
        sent_by_ai: false,
        metadata: {}
      },
      {
        organization_id: organizationId,
        conversation_id: conversationId || '',
        direction: 'outbound',
        content: outboundContent,
        sent_by_ai: true,
        metadata: {}
      }
    ];

    await supabaseAdmin.from('messages').insert(messages);
  }

  async close(): Promise<void> {
    await this.worker.close();
    logger.info('Message processor worker closed');
  }
}

// Iniciar worker se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new MessageProcessorWorker();

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing worker...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, closing worker...');
    await worker.close();
    process.exit(0);
  });
}

export const messageProcessorWorker = new MessageProcessorWorker();
