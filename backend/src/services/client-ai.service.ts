import { openai } from '../config/openai';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

export class ClientAIService {
  /**
   * Processa mensagem de cliente
   */
  static async processClientMessage(
    organizationId: string,
    contactId: string,
    conversationId: string,
    content: string
  ): Promise<string> {
    try {
      // Buscar histórico da conversa
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20);

      // Buscar dados do contato e pets
      const { data: contact } = await supabase
        .from('contacts')
        .select('*, pets(*)')
        .eq('id', contactId)
        .single();

      // Buscar serviços disponíveis
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // Buscar configurações da IA
      const { data: settings } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      // Montar histórico de mensagens para contexto
      const conversationHistory = messages?.map((msg) => ({
        role: msg.from_me ? ('assistant' as const) : ('user' as const),
        content: msg.content,
      })) || [];

      // Chamar OpenAI
      const response = await openai.chat.completions.create({
        model: settings?.ai_config?.model || 'gpt-4o-mini',
        temperature: settings?.ai_config?.temperature || 0.7,
        messages: [
          {
            role: 'system',
            content: this.getClientAISystemPrompt(settings, services, contact),
          },
          ...conversationHistory,
          {
            role: 'user',
            content,
          },
        ],
        tools: this.getClientAIFunctions(),
        tool_choice: 'auto',
      });

      const assistantMessage = response.choices[0].message;

      // Se chamou funções, executar
      if (assistantMessage.tool_calls) {
        const functionResults = await this.executeFunctions(
          assistantMessage.tool_calls,
          organizationId,
          contactId
        );

        // Salvar interação com function calling
        await supabase.from('ai_interactions').insert({
          organization_id: organizationId,
          conversation_id: conversationId,
          ai_type: 'client',
          model: settings?.ai_config?.model || 'gpt-4o-mini',
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
          function_calls: assistantMessage.tool_calls,
          function_results: functionResults,
          status: 'success',
        });

        // Chamar IA novamente com resultados
        const finalResponse = await openai.chat.completions.create({
          model: settings?.ai_config?.model || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: this.getClientAISystemPrompt(settings, services, contact),
            },
            ...conversationHistory,
            { role: 'user', content },
            assistantMessage,
            ...functionResults.map((result) => ({
              role: 'tool' as const,
              tool_call_id: result.tool_call_id,
              content: JSON.stringify(result.result),
            })),
          ],
        });

        return finalResponse.choices[0].message.content || 'Desculpe, não entendi.';
      }

      // Salvar interação sem function calling
      await supabase.from('ai_interactions').insert({
        organization_id: organizationId,
        conversation_id: conversationId,
        ai_type: 'client',
        model: settings?.ai_config?.model || 'gpt-4o-mini',
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
        status: 'success',
      });

      return assistantMessage.content || 'Desculpe, não entendi.';
    } catch (error) {
      logger.error({ error, organizationId, contactId }, 'Error processing client message');
      return 'Desculpe, ocorreu um erro. Por favor, tente novamente.';
    }
  }

  /**
   * System prompt para IA do cliente
   */
  private static getClientAISystemPrompt(settings: any, services: any[], contact: any): string {
    const personality = settings?.ai_personality || {};
    
    return `Você é ${personality.name || 'o assistente'} de um ${personality.business_type || 'petshop'}.

**Seu tom:** ${personality.tone || 'amigável e profissional'}

**Serviços disponíveis:**
${services?.map(s => `- ${s.name}: R$ ${s.price} (${s.duration_minutes} min)`).join('\n')}

**Informações do cliente:**
- Nome: ${contact?.name || 'Cliente'}
- Telefone: ${contact?.phone}
${contact?.pets?.length > 0 ? `- Pets: ${contact.pets.map((p: any) => `${p.name} (${p.species})`).join(', ')}` : '- Nenhum pet cadastrado ainda'}

**Suas responsabilidades:**
1. Atender com cordialidade e profissionalismo
2. Responder dúvidas sobre serviços
3. Ajudar a cadastrar pets quando necessário
4. Agendar consultas e serviços
5. Confirmar horários disponíveis
6. Enviar lembretes
7. Escalar para humano quando não souber responder

**Regras:**
- Sempre confirme dados importantes antes de cadastrar ou agendar
- Seja breve e objetivo
- Use o nome do pet quando possível
- Se não souber algo, admita e ofereça ajuda humana
- Nunca invente informações sobre preços ou horários

**Quando escalar para humano:**
- Emergências médicas
- Reclamações sérias
- Solicitações fora do escopo
- Quando cliente pedir explicitamente`;
  }

  /**
   * Funções disponíveis para IA do cliente
   */
  private static getClientAIFunctions() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'register_pet',
          description: 'Cadastra um novo pet para o cliente',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Nome do pet' },
              species: { 
                type: 'string', 
                enum: ['dog', 'cat', 'bird', 'rabbit', 'other'],
                description: 'Espécie do pet' 
              },
              breed: { type: 'string', description: 'Raça (opcional)' },
              age: { type: 'number', description: 'Idade em anos (opcional)' },
            },
            required: ['name', 'species'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'book_appointment',
          description: 'Agenda um serviço para o pet',
          parameters: {
            type: 'object',
            properties: {
              pet_name: { type: 'string', description: 'Nome do pet' },
              service_type: { type: 'string', description: 'Tipo de serviço' },
              preferred_date: { type: 'string', description: 'Data preferida (YYYY-MM-DD)' },
              preferred_time: { type: 'string', description: 'Horário preferido (HH:MM)' },
            },
            required: ['pet_name', 'service_type', 'preferred_date'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'check_availability',
          description: 'Verifica horários disponíveis',
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Data para verificar (YYYY-MM-DD)' },
            },
            required: ['date'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'escalate_to_human',
          description: 'Escala a conversa para atendimento humano',
          parameters: {
            type: 'object',
            properties: {
              reason: { type: 'string', description: 'Motivo da escalação' },
            },
            required: ['reason'],
          },
        },
      },
    ];
  }

  /**
   * Executar funções
   */
  private static async executeFunctions(toolCalls: any[], organizationId: string, contactId: string) {
    const results = [];

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      let result;

      switch (functionName) {
        case 'register_pet':
          result = await this.registerPet(organizationId, contactId, args);
          break;
        case 'book_appointment':
          result = await this.bookAppointment(organizationId, contactId, args);
          break;
        case 'check_availability':
          result = await this.checkAvailability(organizationId, args.date);
          break;
        case 'escalate_to_human':
          result = await this.escalateToHuman(organizationId, contactId, args.reason);
          break;
        default:
          result = { error: 'Function not found' };
      }

      results.push({
        tool_call_id: toolCall.id,
        result,
      });
    }

    return results;
  }

  /**
   * Cadastrar pet
   */
  private static async registerPet(organizationId: string, contactId: string, petData: any) {
    const { data, error } = await supabase
      .from('pets')
      .insert({
        organization_id: organizationId,
        contact_id: contactId,
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        birth_date: petData.age
          ? new Date(new Date().setFullYear(new Date().getFullYear() - petData.age)).toISOString()
          : null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, pet: data };
  }

  /**
   * Agendar serviço
   */
  private static async bookAppointment(organizationId: string, contactId: string, bookingData: any) {
    // Buscar pet pelo nome
    const { data: pet } = await supabase
      .from('pets')
      .select('*')
      .eq('contact_id', contactId)
      .ilike('name', bookingData.pet_name)
      .single();

    if (!pet) {
      return { success: false, error: 'Pet não encontrado' };
    }

    // Buscar serviço
    const { data: service } = await supabase
      .from('services')
      .select('*')
      .eq('organization_id', organizationId)
      .ilike('name', `%${bookingData.service_type}%`)
      .single();

    if (!service) {
      return { success: false, error: 'Serviço não encontrado' };
    }

    // Criar agendamento
    const startTime = new Date(`${bookingData.preferred_date}T${bookingData.preferred_time || '10:00'}:00`);
    const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        organization_id: organizationId,
        contact_id: contactId,
        pet_id: pet.id,
        service_id: service.id,
        booking_type: 'appointment',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: service.duration_minutes,
        price: service.price,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, booking: data };
  }

  /**
   * Verificar disponibilidade
   */
  private static async checkAvailability(organizationId: string, date: string) {
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('organization_id', organizationId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .neq('status', 'cancelled');

    // Horários padrão (8h às 18h)
    const availableSlots = [];
    for (let hour = 8; hour < 18; hour++) {
      const slotTime = new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00`);
      const isBooked = bookings?.some(b => {
        const bookingStart = new Date(b.start_time);
        const bookingEnd = new Date(b.end_time);
        return slotTime >= bookingStart && slotTime < bookingEnd;
      });

      if (!isBooked) {
        availableSlots.push(`${hour}:00`);
      }
    }

    return { date, available_slots: availableSlots };
  }

  /**
   * Escalar para humano
   */
  private static async escalateToHuman(organizationId: string, contactId: string, reason: string) {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('contact_id', contactId)
      .eq('status', 'active')
      .single();

    if (conversation) {
      await supabase
        .from('conversations')
        .update({
          status: 'escalated',
          escalated_at: new Date().toISOString(),
          escalation_reason: reason,
        })
        .eq('id', conversation.id);
    }

    return { success: true, escalated: true, reason };
  }
}
