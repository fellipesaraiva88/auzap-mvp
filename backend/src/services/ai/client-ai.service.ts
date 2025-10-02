import { openai, AI_MODELS, calculateCost } from '../../config/openai.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import type { TablesInsert } from '../../types/database.types.js';
import { petsService } from '../pets/pets.service.js';
import { bookingsService } from '../bookings/bookings.service.js';
import { contextBuilderService, type ClientContext } from '../context/context-builder.service.js';

interface AIContext {
  organizationId: string;
  contactId: string;
  conversationId: string;
  context?: ClientContext;
}

export class ClientAIService {
  private systemPrompt = `Você é um assistente virtual de atendimento para um petshop/clínica veterinária.

Suas responsabilidades:
1. Atender clientes de forma cordial e profissional
2. Cadastrar pets automaticamente durante a conversa
3. Agendar consultas, banhos, hotel e outros serviços
4. Responder dúvidas sobre serviços e horários
5. Enviar confirmações e lembretes
6. Escalar para atendimento humano quando necessário

Diretrizes:
- Seja sempre educado e empático
- Faça perguntas claras para obter informações necessárias
- Confirme dados importantes (data/hora de agendamento, nome do pet)
- Use as funções disponíveis para cadastrar e agendar
- Se não souber responder algo, escale para humano

Informações que você pode coletar:
- Nome do tutor
- Nome do pet
- Espécie (cachorro, gato, etc)
- Raça
- Idade
- Serviço desejado
- Data e horário preferidos`;

  /**
   * Processa mensagem do cliente
   */
  async processMessage(context: AIContext, message: string): Promise<string> {
    try {
      logger.info({ contactId: context.contactId }, 'Processing client message with AI');

      // Buscar contexto enriquecido se não foi fornecido
      let clientContext = context.context;
      if (!clientContext) {
        clientContext = await contextBuilderService.buildClientContext(
          context.organizationId,
          context.contactId,
          context.conversationId
        );
      }

      // Construir contexto formatado
      const contextInfo = contextBuilderService.formatContextForPrompt(clientContext);

      // Criar mensagens para o GPT (usa últimas 5 msgs do contexto)
      const messages: any[] = [
        { role: 'system', content: this.systemPrompt + '\n\n' + contextInfo },
        ...clientContext.recentMessages,
        { role: 'user', content: message }
      ];

      // Chamar OpenAI com Function Calling (GPT-4o-mini)
      const response = await openai.chat.completions.create({
        model: AI_MODELS.CLIENT,
        messages,
        functions: this.getFunctions(),
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 500
      });

      const choice = response.choices[0];
      const usage = response.usage!;

      // Calcular custo
      const cost = calculateCost(AI_MODELS.CLIENT, usage.prompt_tokens, usage.completion_tokens);

      // Log da interação
      await this.logInteraction(context, message, choice, cost);

      // Se chamou função
      if (choice.message.function_call) {
        const result = await this.handleFunctionCall(
          context.organizationId,
          context.contactId,
          choice.message.function_call
        );

        // Chamar GPT novamente com resultado da função
        messages.push(choice.message as any);
        messages.push({
          role: 'function',
          name: choice.message.function_call.name,
          content: JSON.stringify(result)
        });

        const followUp = await openai.chat.completions.create({
          model: AI_MODELS.CLIENT,
          messages,
          temperature: 0.7,
          max_tokens: 500
        });

        return followUp.choices[0].message.content || 'Desculpe, não entendi.';
      }

      return choice.message.content || 'Desculpe, não entendi.';
    } catch (error) {
      logger.error({ error }, 'Error processing message with AI');
      return 'Desculpe, tive um problema ao processar sua mensagem. Posso transferir para um atendente humano?';
    }
  }

  /**
   * Funções disponíveis para o GPT
   */
  private getFunctions(): any[] {
    return [
      {
        name: 'cadastrar_pet',
        description: 'Cadastra um novo pet para o cliente',
        parameters: {
          type: 'object',
          properties: {
            nome: { type: 'string', description: 'Nome do pet' },
            especie: {
              type: 'string',
              enum: ['dog', 'cat', 'bird', 'rabbit', 'other'],
              description: 'Espécie do pet'
            },
            raca: { type: 'string', description: 'Raça do pet (opcional)' },
            idade_anos: { type: 'number', description: 'Idade em anos (opcional)' },
            idade_meses: { type: 'number', description: 'Idade em meses (opcional)' },
            genero: {
              type: 'string',
              enum: ['male', 'female', 'unknown'],
              description: 'Gênero do pet'
            }
          },
          required: ['nome', 'especie']
        }
      },
      {
        name: 'agendar_servico',
        description: 'Agenda um serviço para o pet',
        parameters: {
          type: 'object',
          properties: {
            pet_nome: { type: 'string', description: 'Nome do pet' },
            tipo_servico: {
              type: 'string',
              enum: ['consultation', 'grooming', 'hotel', 'daycare', 'surgery', 'exam', 'vaccine'],
              description: 'Tipo de serviço'
            },
            data: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
            hora: { type: 'string', description: 'Hora no formato HH:MM' },
            duracao_minutos: { type: 'number', description: 'Duração estimada em minutos' }
          },
          required: ['tipo_servico', 'data', 'hora']
        }
      },
      {
        name: 'consultar_horarios',
        description: 'Consulta horários disponíveis para um serviço',
        parameters: {
          type: 'object',
          properties: {
            tipo_servico: { type: 'string', description: 'Tipo de serviço' },
            data: { type: 'string', description: 'Data desejada (YYYY-MM-DD)' }
          },
          required: ['tipo_servico', 'data']
        }
      },
      {
        name: 'escalar_para_humano',
        description: 'Escalona a conversa para um atendente humano',
        parameters: {
          type: 'object',
          properties: {
            motivo: { type: 'string', description: 'Motivo da escalação' }
          },
          required: ['motivo']
        }
      }
    ];
  }

  /**
   * Executa função chamada pelo GPT
   */
  private async handleFunctionCall(
    organizationId: string,
    contactId: string,
    functionCall: { name: string; arguments: string }
  ): Promise<any> {
    const args = JSON.parse(functionCall.arguments);

    switch (functionCall.name) {
      case 'cadastrar_pet':
        return await this.cadastrarPet(organizationId, contactId, args);

      case 'agendar_servico':
        return await this.agendarServico(organizationId, contactId, args);

      case 'consultar_horarios':
        return await this.consultarHorarios(organizationId, args);

      case 'escalar_para_humano':
        return await this.escalarParaHumano(contactId, args.motivo);

      default:
        return { error: 'Função não encontrada' };
    }
  }

  private async cadastrarPet(organizationId: string, contactId: string, data: any): Promise<any> {
    try {
      const pet = await petsService.create({
        organization_id: organizationId,
        contact_id: contactId,
        name: data.nome,
        species: data.especie,
        breed: data.raca,
        age_years: data.idade_anos,
        age_months: data.idade_meses,
        gender: data.genero
      });

      return {
        success: true,
        message: `Pet ${data.nome} cadastrado com sucesso!`,
        pet_id: pet.id
      };
    } catch (error) {
      logger.error({ error }, 'Error creating pet');
      return { success: false, message: 'Erro ao cadastrar pet' };
    }
  }

  private async agendarServico(organizationId: string, contactId: string, data: any): Promise<any> {
    try {
      // Buscar serviço
      const { data: services } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('type', data.tipo_servico)
        .eq('is_active', true)
        .limit(1);

      if (!services || services.length === 0) {
        return { success: false, message: 'Serviço não disponível' };
      }

      const service = services[0];

      // Criar agendamento
      const scheduledStart = new Date(`${data.data}T${data.hora}`);
      const scheduledEnd = new Date(scheduledStart.getTime() + (data.duracao_minutos || service.duration_minutes) * 60000);

      const booking = await bookingsService.create({
        organization_id: organizationId,
        contact_id: contactId,
        service_id: service.id,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        status: 'pending',
        created_by_ai: true
      });

      return {
        success: true,
        message: `Agendamento criado para ${data.data} às ${data.hora}`,
        booking_id: booking.id
      };
    } catch (error) {
      logger.error({ error }, 'Error creating booking');
      return { success: false, message: 'Erro ao criar agendamento' };
    }
  }

  private async consultarHorarios(_organizationId: string, _data: any): Promise<any> {
    // Buscar horários disponíveis (implementação simplificada)
    return {
      success: true,
      horarios_disponiveis: [
        '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
      ]
    };
  }

  private async escalarParaHumano(contactId: string, motivo: string): Promise<any> {
    // Marcar conversa como escalada
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('contact_id', contactId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (conversation) {
      await supabaseAdmin
        .from('conversations')
        .update({
          status: 'escalated',
          escalated_to_human_at: new Date().toISOString(),
          escalation_reason: motivo
        })
        .eq('id', conversation.id);
    }

    return {
      success: true,
      message: 'Conversa transferida para atendente humano'
    };
  }


  private async logInteraction(
    context: AIContext,
    _message: string,
    choice: any,
    cost: number
  ): Promise<void> {
    const interactionData: TablesInsert<'ai_interactions'> = {
      organization_id: context.organizationId,
      contact_id: context.contactId,
      model: AI_MODELS.CLIENT,
      prompt_tokens: choice.usage?.prompt_tokens,
      completion_tokens: choice.usage?.completion_tokens,
      total_cost_cents: cost,
      intent_detected: choice.message.function_call?.name || 'conversation',
      confidence_score: 0.9
    };
    await supabaseAdmin.from('ai_interactions').insert(interactionData);
  }
}

export const clientAIService = new ClientAIService();
