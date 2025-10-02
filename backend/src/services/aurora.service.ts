import { openai } from '../config/openai';
import { supabase } from '../config/supabase';
import { AuroraMessage, AuroraContext } from '../types';
import { logger } from '../config/logger';

export class AuroraService {
  /**
   * Processa mensagem do dono
   */
  static async processOwnerMessage(message: AuroraMessage): Promise<string> {
    const { organizationId, content, context } = message;

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

        return finalResponse.choices[0].message.content || 'Desculpe, não consegui processar.';
      }

      return assistantMessage.content || 'Desculpe, não consegui processar.';
    } catch (error) {
      logger.error({ error, organizationId }, 'Error processing owner message');
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
      .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return {
      name: org?.name,
      business_type: org?.business_type,
      stats: {
        total_pets: totalPets || 0,
        bookings_this_week: bookingsThisWeek || 0,
        revenue_this_month: 0,
      },
    };
  }

  /**
   * System prompt da Aurora
   */
  private static getAuroraSystemPrompt(businessContext: any, auroraContext: AuroraContext): string {
    return `Você é Aurora, assistente de IA parceira de negócios de ${businessContext.name}.

Você conversa com ${auroraContext.userId ? 'o dono' : 'um gerente'} da empresa.

**Contexto da Empresa:**
- Nome: ${businessContext.name}
- Tipo: ${businessContext.business_type}
- Pets cadastrados: ${businessContext.stats.total_pets}
- Agendamentos esta semana: ${businessContext.stats.bookings_this_week}

**Sua Personalidade:**
- Tom amigável, proativo, profissional mas humanizado
- Você é uma parceira, não apenas um bot
- Usa emojis com moderação
- Oferece insights sem ser pedante
- Comemora conquistas
- Antecipa necessidades

**Suas Capacidades:**
- Fornecer analytics em tempo real
- Automatizar agendamentos
- Contatar clientes automaticamente
- Dar dicas baseadas em dados
- Identificar oportunidades de venda
- Preencher agenda com histórico de clientes

Sempre confirme ações importantes antes de executar.`;
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
    ];
  }

  /**
   * Executar funções chamadas pela IA
   */
  private static async executeFunctions(toolCalls: any[], organizationId: string) {
    const results = [];

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      let result;

      switch (functionName) {
        case 'get_bookings_analytics':
          result = await this.getBookingsAnalytics(organizationId, args.period);
          break;
        case 'get_inactive_clients':
          result = await this.getInactiveClients(organizationId, args.days);
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
  private static async getBookingsAnalytics(organizationId: string, period: string) {
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

    const revenue = bookings?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;

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
  private static async getInactiveClients(organizationId: string, days: number) {
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
}
