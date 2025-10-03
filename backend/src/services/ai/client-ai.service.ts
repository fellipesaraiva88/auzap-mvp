import { openai, AI_MODELS, calculateCost } from '../../config/openai.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import type { TablesInsert } from '../../types/database.types.js';
import { petsService } from '../pets/pets.service.js';
import { bookingsService } from '../bookings/bookings.service.js';
import { contextBuilderService, type ClientContext } from '../context/context-builder.service.js';
import { TrainingService } from '../training/training.service.js';
import { DaycareService } from '../daycare/daycare.service.js';
import { BipeService } from '../bipe/bipe.service.js';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service.js';

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
      // === Core Pet & Service Functions ===
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

      // === Training Functions (NEW) ===
      {
        name: 'criar_plano_adestramento',
        description: 'Criar novo plano de adestramento para um pet',
        parameters: {
          type: 'object',
          properties: {
            petId: { type: 'string', description: 'ID do pet' },
            planType: {
              type: 'string',
              enum: ['basico', 'intermediario', 'avancado', 'personalizado'],
              description: 'Tipo do plano de adestramento'
            },
            goals: {
              type: 'array',
              items: { type: 'string' },
              description: 'Objetivos do adestramento'
            },
            totalSessions: { type: 'number', description: 'Total de sessões' }
          },
          required: ['petId', 'planType', 'goals', 'totalSessions']
        }
      },
      {
        name: 'listar_planos_adestramento',
        description: 'Listar planos de adestramento de um contato ou pet',
        parameters: {
          type: 'object',
          properties: {
            petId: { type: 'string', description: 'ID do pet (opcional)' }
          }
        }
      },

      // === Daycare/Hotel Functions (NEW) ===
      {
        name: 'criar_reserva_hospedagem',
        description: 'Criar reserva de daycare ou hospedagem para pet',
        parameters: {
          type: 'object',
          properties: {
            petId: { type: 'string', description: 'ID do pet' },
            stayType: {
              type: 'string',
              enum: ['daycare_diario', 'hospedagem_pernoite', 'hospedagem_estendida'],
              description: 'Tipo de estadia'
            },
            checkInDate: { type: 'string', format: 'date', description: 'Data de entrada (YYYY-MM-DD)' },
            checkOutDate: { type: 'string', format: 'date', description: 'Data de saída (YYYY-MM-DD)' },
            specialRequests: { type: 'string', description: 'Pedidos especiais (opcional)' }
          },
          required: ['petId', 'stayType', 'checkInDate', 'checkOutDate']
        }
      },
      {
        name: 'listar_reservas_hospedagem',
        description: 'Listar reservas de hospedagem/daycare',
        parameters: {
          type: 'object',
          properties: {
            petId: { type: 'string', description: 'ID do pet (opcional)' },
            status: {
              type: 'string',
              enum: ['reservado', 'em_andamento', 'concluido'],
              description: 'Status da reserva (opcional)'
            }
          }
        }
      },

      // === BIPE Protocol Functions (NEW) ===
      {
        name: 'consultar_bipe_pet',
        description: 'Consultar protocolo BIPE (saúde integral) de um pet',
        parameters: {
          type: 'object',
          properties: {
            petId: { type: 'string', description: 'ID do pet' }
          },
          required: ['petId']
        }
      },
      {
        name: 'adicionar_alerta_saude',
        description: 'Adicionar alerta de saúde urgente ao protocolo BIPE',
        parameters: {
          type: 'object',
          properties: {
            petId: { type: 'string', description: 'ID do pet' },
            type: {
              type: 'string',
              enum: ['vacina_atrasada', 'vermifugo_atrasado', 'comportamento_critico', 'saude_urgente'],
              description: 'Tipo de alerta'
            },
            description: { type: 'string', description: 'Descrição do alerta' }
          },
          required: ['petId', 'type', 'description']
        }
      },

      // === Knowledge Base Function (NEW) ===
      {
        name: 'consultar_base_conhecimento',
        description: 'Buscar resposta na base de conhecimento da organização',
        parameters: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'Pergunta do cliente' }
          },
          required: ['question']
        }
      },

      // === System Functions ===
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
      // === Core Pet & Service Functions ===
      case 'cadastrar_pet':
        return await this.cadastrarPet(organizationId, contactId, args);

      case 'agendar_servico':
        return await this.agendarServico(organizationId, contactId, args);

      case 'consultar_horarios':
        return await this.consultarHorarios(organizationId, args);

      // === Training Functions ===
      case 'criar_plano_adestramento':
        return await this.criarPlanoAdestramento(organizationId, contactId, args);

      case 'listar_planos_adestramento':
        return await this.listarPlanosAdestramento(organizationId, contactId, args.petId);

      // === Daycare/Hotel Functions ===
      case 'criar_reserva_hospedagem':
        return await this.criarReservaHospedagem(organizationId, contactId, args);

      case 'listar_reservas_hospedagem':
        return await this.listarReservasHospedagem(organizationId, contactId, args);

      // === BIPE Protocol Functions ===
      case 'consultar_bipe_pet':
        return await this.consultarBipePet(organizationId, args.petId);

      case 'adicionar_alerta_saude':
        return await this.adicionarAlertaSaude(organizationId, args);

      // === Knowledge Base Function ===
      case 'consultar_base_conhecimento':
        return await this.consultarBaseConhecimento(organizationId, args.question);

      // === System Functions ===
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

  /**
   * Verificar disponibilidade de adestramento
   */
  private async checkAvailabilityTraining(
    organizationId: string,
    date: string,
    planType: string
  ): Promise<any> {
    try {
      logger.info({ organizationId, date, planType }, 'Checking training availability');

      // Buscar planos criados na data (usando created_at como referência)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingPlans } = await supabaseAdmin
        .from('training_plans')
        .select('id')
        .eq('organization_id', organizationId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .eq('status', 'em_andamento');

      const bookedSlots = existingPlans?.length || 0;
      const maxSlots = 5; // Máximo de treinos por dia
      const available = maxSlots - bookedSlots;

      return {
        success: true,
        available: available > 0,
        availableSlots: available,
        message: available > 0
          ? `Temos ${available} vaga(s) disponível(is) para ${date}`
          : `Desculpe, não há vagas disponíveis para ${date}. Podemos tentar outra data?`
      };
    } catch (error) {
      logger.error({ error, organizationId, date }, 'Error checking availability');
      return {
        success: false,
        available: false,
        message: 'Erro ao verificar disponibilidade.'
      };
    }
  }

  /**
   * Criar plano de adestramento (NEW)
   */
  private async criarPlanoAdestramento(
    organizationId: string,
    contactId: string,
    args: any
  ): Promise<any> {
    try {
      logger.info({ organizationId, contactId }, 'Creating training plan via new AI function');

      const plan = await TrainingService.createTrainingPlan({
        organizationId,
        petId: args.petId,
        contactId,
        initialAssessment: {
          rotina: args.goals.join(', '),
          problemas: args.goals,
          relacao_familia: 'A ser avaliado',
          historico_saude: 'A ser avaliado',
          observacao_pratica: 'A ser avaliado',
          objetivos: args.goals
        },
        planType: args.planType,
        durationWeeks: Math.ceil(args.totalSessions / 4),
        methodology: args.planType === 'basico' ? 'positivo' : 'misto',
        locationType: 'casa_tutor'
      });

      return {
        success: true,
        message: `Plano de adestramento ${args.planType} criado! Total de ${args.totalSessions} sessões.`,
        planId: plan.id
      };
    } catch (error) {
      logger.error({ error }, 'Error creating training plan');
      return {
        success: false,
        message: 'Erro ao criar plano de adestramento'
      };
    }
  }

  /**
   * Listar planos de adestramento (NEW)
   */
  private async listarPlanosAdestramento(
    organizationId: string,
    contactId: string,
    petId?: string
  ): Promise<any> {
    try {
      const { data: plans } = await supabaseAdmin
        .from('training_plans')
        .select(`
          id,
          plan_type,
          status,
          duration_weeks,
          session_frequency,
          created_at
        `)
        .eq('organization_id', organizationId)
        .eq('contact_id', contactId)
        .eq(petId ? 'pet_id' : 'contact_id', petId || contactId)
        .order('created_at', { ascending: false });

      if (!plans || plans.length === 0) {
        return {
          success: true,
          plans: [],
          message: 'Nenhum plano de adestramento encontrado.'
        };
      }

      return {
        success: true,
        plans: plans.map(p => ({
          id: p.id,
          tipo: p.plan_type,
          status: p.status,
          duracao: `${p.duration_weeks} semanas`,
          frequencia: p.session_frequency,
          criado: new Date(p.created_at).toLocaleDateString('pt-BR')
        })),
        message: `Encontrados ${plans.length} plano(s) de adestramento.`
      };
    } catch (error) {
      logger.error({ error }, 'Error listing training plans');
      return {
        success: false,
        plans: [],
        message: 'Erro ao listar planos'
      };
    }
  }

  /**
   * Criar reserva de hospedagem (NEW)
   */
  private async criarReservaHospedagem(
    organizationId: string,
    contactId: string,
    args: any
  ): Promise<any> {
    try {
      const stay = await DaycareService.createStay({
        organizationId,
        petId: args.petId,
        contactId,
        healthAssessment: {
          vacinas: true,
          vermifugo: true,
          exames: [],
          restricoes_alimentares: args.specialRequests ? [args.specialRequests] : []
        },
        behaviorAssessment: {
          socializacao: 'média',
          ansiedade: 'média',
          energia: 'média'
        },
        stayType: args.stayType === 'daycare_diario' ? 'daycare' : 'hotel',
        checkInDate: args.checkInDate,
        checkOutDate: args.checkOutDate,
        extraServices: [],
        notes: args.specialRequests
      });

      return {
        success: true,
        message: `Reserva de ${args.stayType.replace('_', ' ')} criada! Check-in: ${args.checkInDate}`,
        stayId: stay.id,
        status: stay.status
      };
    } catch (error) {
      logger.error({ error }, 'Error creating daycare reservation');
      return {
        success: false,
        message: 'Erro ao criar reserva'
      };
    }
  }

  /**
   * Listar reservas de hospedagem (NEW)
   */
  private async listarReservasHospedagem(
    organizationId: string,
    contactId: string,
    args: any
  ): Promise<any> {
    try {
      let query = supabaseAdmin
        .from('daycare_hotel_stays')
        .select(`
          id,
          stay_type,
          status,
          check_in_date,
          check_out_date,
          pet_id
        `)
        .eq('organization_id', organizationId)
        .eq('contact_id', contactId);

      if (args.petId) {
        query = query.eq('pet_id', args.petId);
      }
      if (args.status) {
        query = query.eq('status', args.status);
      }

      const { data: reservations } = await query
        .order('check_in_date', { ascending: false });

      if (!reservations || reservations.length === 0) {
        return {
          success: true,
          reservations: [],
          message: 'Nenhuma reserva encontrada.'
        };
      }

      return {
        success: true,
        reservations: reservations.map(r => ({
          id: r.id,
          tipo: r.stay_type,
          status: r.status,
          entrada: r.check_in_date,
          saida: r.check_out_date
        })),
        message: `Encontradas ${reservations.length} reserva(s).`
      };
    } catch (error) {
      logger.error({ error }, 'Error listing reservations');
      return {
        success: false,
        reservations: [],
        message: 'Erro ao listar reservas'
      };
    }
  }

  /**
   * Consultar protocolo BIPE do pet (NEW)
   */
  private async consultarBipePet(
    organizationId: string,
    petId: string
  ): Promise<any> {
    try {
      // Como o BIPE é um protocolo de handoff/escalação, vamos verificar se há alertas pendentes
      // relacionados ao pet em questão consultando a tabela de pets
      const { data: pet } = await supabaseAdmin
        .from('pets')
        .select(`
          id,
          name,
          species,
          breed,
          age_years,
          health_notes,
          behavior_notes
        `)
        .eq('id', petId)
        .eq('organization_id', organizationId)
        .single();

      if (!pet) {
        return {
          success: false,
          message: 'Pet não encontrado.',
          protocol: null
        };
      }

      // Simular protocolo BIPE baseado nas notas do pet
      const protocol = {
        behavioral: pet.behavior_notes || 'Nenhuma observação comportamental',
        individual: `${pet.species} - ${pet.breed || 'SRD'} - ${pet.age_years || 0} anos`,
        preventive: 'Verificar cartão de vacinas com o tutor',
        emergent: pet.health_notes || 'Nenhum alerta de saúde'
      };

      const hasAlerts = !!(pet.health_notes || pet.behavior_notes);

      return {
        success: true,
        message: hasAlerts ? 'Pet possui observações no protocolo BIPE.' : 'Protocolo BIPE em dia.',
        protocol,
        hasAlerts,
        petInfo: {
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          age: pet.age_years
        }
      };
    } catch (error) {
      logger.error({ error }, 'Error consulting BIPE protocol');
      return {
        success: false,
        message: 'Erro ao consultar protocolo BIPE'
      };
    }
  }

  /**
   * Adicionar alerta de saúde ao BIPE (NEW)
   */
  private async adicionarAlertaSaude(
    organizationId: string,
    args: any
  ): Promise<any> {
    try {
      // Buscar conversa ativa
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      const conversationId = conversations?.[0]?.id;

      if (!conversationId) {
        return {
          success: false,
          message: 'Nenhuma conversa ativa encontrada.'
        };
      }

      // Criar entrada no BIPE para escalação
      const { data } = await supabaseAdmin
        .from('bipe_protocol')
        .insert({
          organization_id: organizationId,
          conversation_id: conversationId,
          trigger_type: 'health_alert',
          client_question: `ALERTA DE SAÚDE - Pet ID: ${args.petId} - Tipo: ${args.type} - ${args.description}`,
          status: 'pending',
          handoff_active: true,
          handoff_reason: `Alerta de saúde: ${args.type}`
        })
        .select()
        .single();

      // Atualizar notas de saúde do pet
      await supabaseAdmin
        .from('pets')
        .update({
          health_notes: args.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', args.petId)
        .eq('organization_id', organizationId);

      return {
        success: true,
        message: `Alerta de saúde registrado! Tipo: ${args.type}. O gestor foi notificado.`,
        alertId: data?.id
      };
    } catch (error) {
      logger.error({ error }, 'Error adding health alert');
      return {
        success: false,
        message: 'Erro ao adicionar alerta de saúde'
      };
    }
  }

  /**
   * Consultar base de conhecimento (NEW)
   */
  private async consultarBaseConhecimento(
    organizationId: string,
    question: string
  ): Promise<any> {
    try {
      logger.info({ organizationId, question }, 'Searching knowledge base');

      const results = await KnowledgeBaseService.searchKnowledge(organizationId, question);

      if (results.length === 0) {
        return {
          success: false,
          found: false,
          message: 'Não encontrei resposta para sua pergunta. Vou consultar um especialista.'
        };
      }

      // Incrementar uso
      await KnowledgeBaseService.incrementUsage(results[0].id);

      return {
        success: true,
        found: true,
        answer: results[0].answer,
        confidence: results.length > 1 ? 'medium' : 'high'
      };
    } catch (error) {
      logger.error({ error }, 'Error searching knowledge base');
      return {
        success: false,
        found: false,
        message: 'Erro ao buscar resposta'
      };
    }
  }
}

export const clientAIService = new ClientAIService();
