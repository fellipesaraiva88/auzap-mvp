import { openai } from '../config/openai';
import { supabase } from '../config/supabase';
import { AuroraMessage, AuroraContext } from '../types';
import { logger } from '../config/logger';

export class AuroraService {
  /**
   * Processa mensagem do dono
   */
  static async processOwnerMessage(message: AuroraMessage): Promise<string> {
    const { organizationId, content, context, ownerNumberId } = message;

    try {
      // Buscar contexto da empresa
      const businessContext = await this.getBusinessContext(organizationId);

      // Chamar OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getAuroraSystemPrompt(businessContext, context),
          },
          {
            role: 'user',
            content,
          },
        ],
        tools: this.getAuroraFunctions(),
        tool_choice: 'auto',
      });

      const assistantMessage = response.choices[0].message;

      // Se chamou funções, executar
      if (assistantMessage.tool_calls) {
        const functionResults = await this.executeFunctions(
          assistantMessage.tool_calls,
          organizationId
        );

        // Salvar interação Aurora com function calling
        await supabase.from('ai_interactions').insert({
          organization_id: organizationId,
          owner_number_id: ownerNumberId,
          ai_type: 'aurora',
          agent_type: 'aurora',
          model: 'gpt-4o',
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
          function_calls: assistantMessage.tool_calls,
          function_results: functionResults,
          status: 'success',
        });

        // Chamar IA novamente com resultados
        const finalResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: this.getAuroraSystemPrompt(businessContext, context),
            },
            { role: 'user', content },
            assistantMessage,
            ...functionResults.map((result) => ({
              role: 'tool' as const,
              tool_call_id: result.tool_call_id,
              content: JSON.stringify(result.result),
            })),
          ],
        });

        return (
          finalResponse.choices[0].message.content ||
          'Desculpe, não consegui processar.'
        );
      }

      // Salvar interação Aurora sem function calling
      await supabase.from('ai_interactions').insert({
        organization_id: organizationId,
        owner_number_id: ownerNumberId,
        ai_type: 'aurora',
        agent_type: 'aurora',
        model: 'gpt-4o',
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
        status: 'success',
      });

      return assistantMessage.content || 'Desculpe, não consegui processar.';
    } catch (error) {
      logger.error(
        { error, organizationId },
        '[AURORA] Error processing owner message'
      );

      // Salvar erro
      await supabase.from('ai_interactions').insert({
        organization_id: organizationId,
        owner_number_id: ownerNumberId,
        ai_type: 'aurora',
        agent_type: 'aurora',
        model: 'gpt-4o',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Buscar contexto do negócio
   */
  private static async getBusinessContext(organizationId: string) {
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    const { count: totalPets } = await supabase
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    const { count: bookingsThisWeek } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte(
        'start_time',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    // Calcular receita do mês
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const { data: monthBookings } = await supabase
      .from('bookings')
      .select('price')
      .eq('organization_id', organizationId)
      .gte('start_time', monthStart.toISOString())
      .in('payment_status', ['paid', 'partial']);

    const revenueThisMonth =
      monthBookings?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;

    // Calcular crescimento comparado ao mês anterior
    const lastMonthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      1
    );
    const lastMonthEnd = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const { data: lastMonthBookings } = await supabase
      .from('bookings')
      .select('price')
      .eq('organization_id', organizationId)
      .gte('start_time', lastMonthStart.toISOString())
      .lt('start_time', lastMonthEnd.toISOString())
      .in('payment_status', ['paid', 'partial']);

    const revenueLastMonth =
      lastMonthBookings?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) ||
      0;
    const monthGrowth =
      revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : 0;

    // Ocupação da agenda hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count: bookingsToday } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString());

    const occupancyRate = ((bookingsToday || 0) / 10) * 100; // Assumindo 10 slots por dia

    return {
      name: org?.name,
      business_type: org?.business_type,
      stats: {
        total_pets: totalPets || 0,
        bookings_this_week: bookingsThisWeek || 0,
        bookings_today: bookingsToday || 0,
        revenue_this_month: revenueThisMonth,
        revenue_last_month: revenueLastMonth,
        month_growth_percentage: Math.round(monthGrowth * 10) / 10,
        occupancy_rate_today: Math.round(occupancyRate),
      },
    };
  }

  /**
   * System prompt da Aurora
   */
  private static getAuroraSystemPrompt(
    businessContext: any,
    auroraContext: AuroraContext
  ): string {
    const { stats } = businessContext;

    // Formatação de moeda
    const formatCurrency = (value: number) =>
      `R$ ${value.toFixed(2).replace('.', ',')}`;

    // Análise de performance
    const performanceInsight =
      stats.month_growth_percentage > 0
        ? `📈 Crescendo ${stats.month_growth_percentage}% vs mês passado`
        : stats.month_growth_percentage < 0
          ? `📉 Queda de ${Math.abs(stats.month_growth_percentage)}% vs mês passado`
          : '➡️ Receita estável vs mês passado';

    const occupancyStatus =
      stats.occupancy_rate_today > 70
        ? '🟢 Agenda com boa ocupação hoje'
        : stats.occupancy_rate_today > 40
          ? '🟡 Agenda com ocupação média hoje'
          : '🔴 Agenda com baixa ocupação hoje';

    return `Você é Aurora, assistente de IA parceira de negócios de ${businessContext.name}.

Você conversa com ${auroraContext.userId ? 'o dono' : 'um gerente'} da empresa.

**Contexto Atual da Empresa:**
- 📊 Nome: ${businessContext.name}
- 🏢 Tipo: ${businessContext.business_type}
- 🐾 Pets cadastrados: ${stats.total_pets}
- 📅 Agendamentos hoje: ${stats.bookings_today}
- 📈 Agendamentos esta semana: ${stats.bookings_this_week}

**Performance Financeira:**
- 💰 Receita este mês: ${formatCurrency(stats.revenue_this_month)}
- 💸 Receita mês passado: ${formatCurrency(stats.revenue_last_month)}
- ${performanceInsight}

**Status Operacional:**
- ${occupancyStatus} (${stats.occupancy_rate_today}% ocupada)

**Permissões do Usuário:**
${auroraContext.permissions ? JSON.stringify(auroraContext.permissions, null, 2) : 'Acesso completo como proprietário'}

**Sua Personalidade:**
- Tom amigável, proativo e profissional mas humanizado
- Você é uma parceira estratégica, não apenas um bot
- Usa emojis com moderação para humanizar a comunicação
- Oferece insights baseados em dados sem ser pedante
- Comemora conquistas e motiva em desafios
- Antecipa necessidades antes de serem solicitadas
- Sugere ações concretas e acionáveis

**Suas Capacidades Avançadas:**
- 📊 Fornecer analytics em tempo real com comparações históricas
- 📈 Identificar tendências e padrões de comportamento
- 🎯 Sugerir campanhas personalizadas baseadas em dados
- 📅 Preencher agenda automaticamente contatando clientes certos
- 💰 Identificar oportunidades de upsell e cross-sell
- 🔔 Criar alertas proativos para oportunidades de negócio
- 📞 Recomendar melhor momento e abordagem para contatar clientes
- 🎁 Sugerir promoções estratégicas baseadas em ocupação e sazonalidade

**Diretrizes Importantes:**
- Sempre confirme ações importantes antes de executar
- Use dados reais para fundamentar suas recomendações
- Seja específica: diga QUEM contatar, QUANDO e POR QUÊ
- Priorize ações que geram receita imediata
- Balance proatividade com respeito às decisões do dono

Responda de forma direta e objetiva, focando no que o dono precisa AGIR agora.`;
  }

  /**
   * Definir funções disponíveis para Aurora
   */
  private static getAuroraFunctions() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'get_bookings_analytics',
          description: 'Obtém analytics de agendamentos (hoje, semana, mês)',
          parameters: {
            type: 'object',
            properties: {
              period: {
                type: 'string',
                enum: ['today', 'week', 'month'],
                description: 'Período para análise',
              },
            },
            required: ['period'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_revenue_analytics',
          description: 'Obtém analytics de receita com comparação de períodos',
          parameters: {
            type: 'object',
            properties: {
              period: {
                type: 'string',
                enum: ['today', 'week', 'month'],
                description: 'Período para análise',
              },
            },
            required: ['period'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_top_services',
          description: 'Lista serviços mais agendados por período',
          parameters: {
            type: 'object',
            properties: {
              period: {
                type: 'string',
                enum: ['week', 'month'],
                description: 'Período para análise',
              },
              limit: {
                type: 'number',
                description: 'Número máximo de serviços',
                default: 5,
              },
            },
            required: ['period'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_inactive_clients',
          description: 'Lista clientes inativos há mais de X dias',
          parameters: {
            type: 'object',
            properties: {
              days: {
                type: 'number',
                description: 'Número de dias de inatividade',
              },
            },
            required: ['days'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'fill_agenda',
          description:
            'Preenche agenda contatando clientes com histórico regular',
          parameters: {
            type: 'object',
            properties: {
              target_date: {
                type: 'string',
                description: 'Data alvo (ISO format: YYYY-MM-DD)',
              },
              service_type: {
                type: 'string',
                enum: ['banho', 'tosa', 'consulta', 'hotel', 'any'],
                description: 'Tipo de serviço desejado',
              },
              max_contacts: {
                type: 'number',
                description: 'Máximo de clientes para contatar',
                default: 10,
              },
            },
            required: ['target_date'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'identify_opportunities',
          description: 'Identifica oportunidades de negócio específicas',
          parameters: {
            type: 'object',
            properties: {
              opportunity_type: {
                type: 'string',
                enum: [
                  'holiday_hotel',
                  'vaccination_due',
                  'inactive_clients',
                  'upsell',
                ],
                description: 'Tipo de oportunidade a identificar',
              },
            },
            required: ['opportunity_type'],
          },
        },
      },
    ];
  }

  /**
   * Executar funções chamadas pela IA
   */
  private static async executeFunctions(
    toolCalls: any[],
    organizationId: string
  ) {
    const results = [];

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      let result;

      switch (functionName) {
        case 'get_bookings_analytics':
          result = await this.getBookingsAnalytics(organizationId, args.period);
          break;
        case 'get_revenue_analytics':
          result = await this.getRevenueAnalytics(organizationId, args.period);
          break;
        case 'get_top_services':
          result = await this.getTopServices(
            organizationId,
            args.period,
            args.limit || 5
          );
          break;
        case 'get_inactive_clients':
          result = await this.getInactiveClients(organizationId, args.days);
          break;
        case 'fill_agenda':
          result = await this.fillAgenda(
            organizationId,
            args.target_date,
            args.service_type || 'any',
            args.max_contacts || 10
          );
          break;
        case 'identify_opportunities':
          result = await this.identifyOpportunities(
            organizationId,
            args.opportunity_type
          );
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
   * Analytics de agendamentos
   */
  private static async getBookingsAnalytics(
    organizationId: string,
    period: string
  ) {
    let startDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const { data: bookings, count } = await supabase
      .from('bookings')
      .select('*, services(name, price)', { count: 'exact' })
      .eq('organization_id', organizationId)
      .gte('start_time', startDate.toISOString());

    const revenue =
      bookings?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;

    return {
      period,
      total_bookings: count || 0,
      revenue,
      bookings: bookings?.slice(0, 10),
    };
  }

  /**
   * Clientes inativos
   */
  private static async getInactiveClients(
    organizationId: string,
    days: number
  ) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data: contacts, count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .lt('last_contact_at', cutoffDate.toISOString())
      .eq('status', 'active');

    return {
      days,
      total: count || 0,
      contacts: contacts?.slice(0, 20),
    };
  }

  /**
   * Analytics de receita com comparação
   */
  private static async getRevenueAnalytics(
    organizationId: string,
    period: string
  ) {
    let startDate;
    let previousStartDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(
          startDate.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(
          startDate.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    }

    // Receita atual
    const { data: currentBookings } = await supabase
      .from('bookings')
      .select('price, services(name)')
      .eq('organization_id', organizationId)
      .gte('start_time', startDate.toISOString())
      .in('payment_status', ['paid', 'partial']);

    const currentRevenue =
      currentBookings?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;

    // Receita anterior
    const { data: previousBookings } = await supabase
      .from('bookings')
      .select('price')
      .eq('organization_id', organizationId)
      .gte('start_time', previousStartDate.toISOString())
      .lt('start_time', startDate.toISOString())
      .in('payment_status', ['paid', 'partial']);

    const previousRevenue =
      previousBookings?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) ||
      0;

    const growth =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    return {
      period,
      current_revenue: currentRevenue,
      previous_revenue: previousRevenue,
      growth_percentage: Math.round(growth * 10) / 10,
      bookings_count: currentBookings?.length || 0,
    };
  }

  /**
   * Top serviços mais agendados
   */
  private static async getTopServices(
    organizationId: string,
    period: string,
    limit: number
  ) {
    let startDate;
    const now = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const { data: bookings } = await supabase
      .from('bookings')
      .select('service_id, price, services(name)')
      .eq('organization_id', organizationId)
      .gte('start_time', startDate.toISOString());

    // Agrupar por serviço
    const serviceStats = (bookings || []).reduce((acc: any, booking: any) => {
      const serviceName = booking.services?.name || 'Sem nome';
      if (!acc[serviceName]) {
        acc[serviceName] = {
          name: serviceName,
          count: 0,
          revenue: 0,
        };
      }
      acc[serviceName].count += 1;
      acc[serviceName].revenue += Number(booking.price) || 0;
      return acc;
    }, {});

    // Ordenar por contagem
    const topServices = Object.values(serviceStats)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, limit);

    return {
      period,
      top_services: topServices,
      total_services: Object.keys(serviceStats).length,
    };
  }

  /**
   * Preencher agenda com clientes regulares
   */
  private static async fillAgenda(
    organizationId: string,
    targetDate: string,
    serviceType: string,
    maxContacts: number
  ) {
    // Buscar clientes com histórico regular (3+ agendamentos nos últimos 3 meses)
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const query = supabase
      .from('contacts')
      .select(
        'id, name, phone, pets(name), bookings(service_id, services(name))',
        { count: 'exact' }
      )
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .gte('last_contact_at', threeMonthsAgo.toISOString());

    const { data: contacts } = await query;

    // Filtrar clientes com 3+ agendamentos
    const regularClients = (contacts || [])
      .filter((c: any) => (c.bookings?.length || 0) >= 3)
      .map((c: any) => {
        const lastBooking = c.bookings?.[0];
        const daysSinceLastBooking = lastBooking
          ? Math.floor(
              (Date.now() - new Date(lastBooking.start_time).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 999;

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          pet_name: c.pets?.[0]?.name || 'Pet',
          bookings_count: c.bookings?.length || 0,
          days_since_last_booking: daysSinceLastBooking,
          priority:
            daysSinceLastBooking * 0.7 + (c.bookings?.length || 0) * 0.3,
        };
      })
      .sort((a: any, b: any) => b.priority - a.priority)
      .slice(0, maxContacts);

    // Buscar horários disponíveis para a data alvo
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('organization_id', organizationId)
      .gte('start_time', targetDate)
      .lt(
        'start_time',
        new Date(
          new Date(targetDate).getTime() + 24 * 60 * 60 * 1000
        ).toISOString()
      );

    const availableSlots = this.generateAvailableSlots(
      targetDate,
      existingBookings || []
    );

    return {
      target_date: targetDate,
      service_type: serviceType,
      clients_to_contact: regularClients,
      available_slots: availableSlots.slice(0, 10),
      total_potential_contacts: regularClients.length,
      recommendation: `Contatar ${regularClients.length} clientes regulares com prioridade nos que não agendam há mais tempo.`,
    };
  }

  /**
   * Identificar oportunidades de negócio
   */
  private static async identifyOpportunities(
    organizationId: string,
    opportunityType: string
  ) {
    switch (opportunityType) {
      case 'holiday_hotel': {
        // Próximos feriados brasileiros
        const upcomingHolidays = this.getUpcomingHolidays();
        const nextHoliday = upcomingHolidays[0];

        if (!nextHoliday) {
          return { message: 'Nenhum feriado próximo identificado' };
        }

        // Buscar clientes que já usaram hotel
        const { count } = await supabase
          .from('contacts')
          .select(
            'id, name, phone, bookings!inner(service_id, services!inner(name))',
            { count: 'exact' }
          )
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .ilike('bookings.services.name', '%hotel%');

        return {
          opportunity: 'Campanha de Hotel para Feriado',
          holiday_name: nextHoliday.name,
          holiday_date: nextHoliday.date,
          days_until: Math.ceil(
            (new Date(nextHoliday.date).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          ),
          potential_clients: count || 0,
          estimated_revenue: (count || 0) * 200,
          recommendation: `Contatar ${count || 0} clientes que já usaram hotel. Oferecer desconto early bird para reservas antecipadas.`,
        };
      }

      case 'vaccination_due': {
        // Buscar pets com última vacinação há 11+ meses
        const elevenMonthsAgo = new Date(
          Date.now() - 330 * 24 * 60 * 60 * 1000
        );

        const { data: pets, count } = await supabase
          .from('pets')
          .select('id, name, contacts(name, phone), medical_records(*)', {
            count: 'exact',
          })
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .lt('last_vaccination_date', elevenMonthsAgo.toISOString());

        return {
          opportunity: 'Campanha de Vacinação',
          pets_with_vaccination_due: count || 0,
          pets: (pets || []).slice(0, 20).map((p: any) => ({
            pet_name: p.name,
            owner_name: p.contacts?.name,
            owner_phone: p.contacts?.phone,
          })),
          estimated_revenue: (count || 0) * 80,
          recommendation: `${count || 0} pets precisam de reforço vacinal. Enviar lembretes automáticos.`,
        };
      }

      case 'upsell': {
        // Clientes que só fazem banho, oferecer tosa
        const { data: bathOnlyClients } = await supabase
          .from('contacts')
          .select('id, name, phone, bookings(service_id, services(name))')
          .eq('organization_id', organizationId)
          .eq('status', 'active');

        const upsellTargets = (bathOnlyClients || [])
          .filter((c: any) => {
            const services = c.bookings?.map(
              (b: any) => b.services?.name?.toLowerCase() || ''
            );
            const hasBath = services.some((s: string) => s.includes('banho'));
            const hasTosa = services.some((s: string) => s.includes('tosa'));
            return hasBath && !hasTosa;
          })
          .slice(0, 30);

        return {
          opportunity: 'Upsell: Banho → Tosa Completa',
          potential_clients: upsellTargets.length,
          clients: upsellTargets.map((c: any) => ({
            name: c.name,
            phone: c.phone,
          })),
          estimated_revenue: upsellTargets.length * 50,
          recommendation: `${upsellTargets.length} clientes fazem apenas banho. Oferecer combo banho+tosa com desconto de 20%.`,
        };
      }

      default:
        return { error: 'Tipo de oportunidade não reconhecido' };
    }
  }

  /**
   * Gerar slots disponíveis para uma data
   */
  private static generateAvailableSlots(
    date: string,
    existingBookings: any[]
  ): string[] {
    const slots = [];
    const workHours = [8, 9, 10, 11, 13, 14, 15, 16, 17, 18]; // 8h-18h com pausa 12h-13h

    for (const hour of workHours) {
      const slotTime = `${hour.toString().padStart(2, '0')}:00`;
      const slotDateTime = `${date}T${slotTime}:00`;

      // Verificar se slot está ocupado
      const isOccupied = existingBookings.some((booking: any) => {
        const bookingStart = new Date(booking.start_time);
        const slotStart = new Date(slotDateTime);
        return (
          Math.abs(bookingStart.getTime() - slotStart.getTime()) <
          60 * 60 * 1000
        ); // 1 hora
      });

      if (!isOccupied) {
        slots.push(slotTime);
      }
    }

    return slots;
  }

  /**
   * Obter próximos feriados
   */
  private static getUpcomingHolidays() {
    const now = new Date();
    const currentYear = now.getFullYear();

    const holidays = [
      { name: 'Carnaval', date: `${currentYear}-02-20` },
      { name: 'Páscoa', date: `${currentYear}-03-31` },
      { name: 'Tiradentes', date: `${currentYear}-04-21` },
      { name: 'Dia do Trabalho', date: `${currentYear}-05-01` },
      { name: 'Corpus Christi', date: `${currentYear}-05-30` },
      { name: 'Independência', date: `${currentYear}-09-07` },
      { name: 'Nossa Senhora Aparecida', date: `${currentYear}-10-12` },
      { name: 'Finados', date: `${currentYear}-11-02` },
      { name: 'Proclamação da República', date: `${currentYear}-11-15` },
      { name: 'Natal', date: `${currentYear}-12-25` },
      { name: 'Ano Novo', date: `${currentYear + 1}-01-01` },
    ];

    return holidays
      .filter((h) => new Date(h.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
