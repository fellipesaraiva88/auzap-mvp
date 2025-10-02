import { openai, AI_MODELS, calculateCost } from '../../config/openai.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { bookingsService } from '../bookings/bookings.service.js';
import { contactsService } from '../contacts/contacts.service.js';

interface AuroraContext {
  organizationId: string;
  ownerPhone: string;
  ownerName: string;
}

export class AuroraService {
  private systemPrompt = `Você é Aurora, assistente virtual e parceira de negócios do dono de uma clínica veterinária/petshop.

Suas capacidades:
1. Fornecer analytics e métricas do negócio
2. Sugerir automações e campanhas de marketing
3. Preencher agenda proativamente
4. Identificar oportunidades de crescimento
5. Enviar resumos diários e insights
6. Alertar sobre clientes inativos
7. Comemorar metas atingidas

Estilo de comunicação:
- Profissional mas próxima, como uma sócia de negócios
- Proativa em sugerir melhorias
- Data-driven: sempre baseie recomendações em números
- Concisa mas completa

Você tem acesso a:
- Dados de agendamentos
- Informações de clientes e pets
- Histórico de interações
- Métricas de negócio

Nunca:
- Responda dúvidas de clientes finais (você é apenas para o dono)
- Tome ações sem confirmação do dono
- Compartilhe dados sensíveis sem contexto apropriado`;

  /**
   * Processa mensagem do dono
   */
  async processOwnerMessage(context: AuroraContext, message: string): Promise<string> {
    try {
      logger.info({ organizationId: context.organizationId }, 'Processing owner message with Aurora');

      // Buscar dados de contexto
      const analytics = await this.getAnalytics(context.organizationId);

      // Construir mensagens
      const messages: any[] = [
        {
          role: 'system',
          content: this.systemPrompt + '\n\n' + this.buildContextInfo(analytics, context.ownerName)
        },
        { role: 'user', content: message }
      ];

      // Chamar OpenAI
      const response = await openai.chat.completions.create({
        model: AI_MODELS.AURORA,
        messages,
        functions: this.getFunctions(),
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 800
      });

      const choice = response.choices[0];

      // Se chamou função
      if (choice.message.function_call) {
        const result = await this.handleFunctionCall(
          context.organizationId,
          choice.message.function_call
        );

        // Chamar GPT novamente com resultado
        messages.push(choice.message as any);
        messages.push({
          role: 'function',
          name: choice.message.function_call.name,
          content: JSON.stringify(result)
        });

        const followUp = await openai.chat.completions.create({
          model: AI_MODELS.AURORA,
          messages,
          temperature: 0.7,
          max_tokens: 800
        });

        return followUp.choices[0].message.content || 'Desculpe, tive um problema.';
      }

      return choice.message.content || 'Como posso ajudar?';
    } catch (error) {
      logger.error({ error }, 'Error processing owner message');
      return 'Desculpe, tive um problema ao processar sua mensagem.';
    }
  }

  /**
   * Gera resumo diário automático
   */
  async generateDailySummary(organizationId: string): Promise<string> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Buscar agendamentos de hoje
      const todayBookings = await bookingsService.listByOrganization(organizationId, {
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString()
      });

      // Buscar agendamentos de amanhã
      const tomorrowDate = new Date(tomorrow);
      const dayAfterTomorrow = new Date(tomorrowDate);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const tomorrowBookings = await bookingsService.listByOrganization(organizationId, {
        startDate: tomorrowDate.toISOString(),
        endDate: dayAfterTomorrow.toISOString()
      });

      // Estatísticas
      const completed = todayBookings.filter(b => b.status === 'completed').length;
      const cancelled = todayBookings.filter(b => b.status === 'cancelled').length;
      const noShow = todayBookings.filter(b => b.status === 'no_show').length;

      // Construir mensagem
      let summary = `📊 *Resumo do Dia* - ${today.toLocaleDateString('pt-BR')}\n\n`;
      
      summary += `*Hoje:*\n`;
      summary += `✅ Atendimentos completados: ${completed}\n`;
      summary += `❌ Cancelamentos: ${cancelled}\n`;
      summary += `⚠️ No-shows: ${noShow}\n`;
      summary += `📋 Total de agendamentos: ${todayBookings.length}\n\n`;

      summary += `*Amanhã:*\n`;
      summary += `📅 ${tomorrowBookings.length} agendamentos previstos\n\n`;

      // Alertas
      if (noShow > 0) {
        summary += `⚠️ *Atenção:* ${noShow} no-show(s) hoje. Considere enviar lembretes mais próximos do horário.\n\n`;
      }

      if (tomorrowBookings.length < 5) {
        summary += `💡 *Oportunidade:* Agenda de amanhã está com ${tomorrowBookings.length} agendamentos. Que tal uma campanha de última hora?\n`;
      }

      return summary;
    } catch (error) {
      logger.error({ error }, 'Error generating daily summary');
      return 'Erro ao gerar resumo diário';
    }
  }

  /**
   * Identifica oportunidades de negócio
   */
  async identifyOpportunities(organizationId: string): Promise<string[]> {
    const opportunities: string[] = [];

    try {
      // Clientes inativos (30+ dias)
      const inactiveContacts = await contactsService.findInactive(organizationId, 30);
      if (inactiveContacts.length > 0) {
        opportunities.push(
          `🔄 ${inactiveContacts.length} clientes sem interação há mais de 30 dias. Campanha de reativação?`
        );
      }

      // Agenda vazia nos próximos 3 dias
      const threeDaysAhead = new Date();
      threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);
      const futureBookings = await bookingsService.listByOrganization(organizationId, {
        startDate: new Date().toISOString(),
        endDate: threeDaysAhead.toISOString()
      });

      if (futureBookings.length < 10) {
        opportunities.push(
          `📅 Apenas ${futureBookings.length} agendamentos nos próximos 3 dias. Hora de preencher a agenda!`
        );
      }

      return opportunities;
    } catch (error) {
      logger.error({ error }, 'Error identifying opportunities');
      return [];
    }
  }

  // Métodos privados

  private getFunctions(): any[] {
    return [
      {
        name: 'buscar_analytics',
        description: 'Busca métricas e analytics do negócio',
        parameters: {
          type: 'object',
          properties: {
            periodo: {
              type: 'string',
              enum: ['hoje', 'semana', 'mes', 'ano'],
              description: 'Período para as métricas'
            }
          },
          required: ['periodo']
        }
      },
      {
        name: 'listar_clientes_inativos',
        description: 'Lista clientes sem interação recente',
        parameters: {
          type: 'object',
          properties: {
            dias: { type: 'number', description: 'Dias de inatividade (padrão: 30)' }
          }
        }
      },
      {
        name: 'sugerir_campanha',
        description: 'Sugere campanha de marketing automática',
        parameters: {
          type: 'object',
          properties: {
            tipo: {
              type: 'string',
              enum: ['reativacao', 'promocional', 'aniversario'],
              description: 'Tipo de campanha'
            }
          },
          required: ['tipo']
        }
      }
    ];
  }

  private async handleFunctionCall(
    organizationId: string,
    functionCall: { name: string; arguments: string }
  ): Promise<any> {
    const args = JSON.parse(functionCall.arguments);

    switch (functionCall.name) {
      case 'buscar_analytics':
        return await this.getAnalytics(organizationId, args.periodo);

      case 'listar_clientes_inativos':
        const inactive = await contactsService.findInactive(organizationId, args.dias || 30);
        return {
          total: inactive.length,
          clientes: inactive.slice(0, 10).map(c => ({
            nome: c.full_name,
            telefone: c.phone_number,
            ultima_interacao: c.last_interaction_at
          }))
        };

      case 'sugerir_campanha':
        return {
          tipo: args.tipo,
          sugestao: 'Campanha criada! Deseja que eu a execute automaticamente?'
        };

      default:
        return { error: 'Função não encontrada' };
    }
  }

  private async getAnalytics(organizationId: string, periodo: string = 'semana'): Promise<any> {
    const now = new Date();
    let startDate = new Date(now);

    switch (periodo) {
      case 'hoje':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'mes':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'ano':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const bookings = await bookingsService.listByOrganization(organizationId, {
      startDate: startDate.toISOString()
    });

    return {
      total_agendamentos: bookings.length,
      completados: bookings.filter(b => b.status === 'completed').length,
      cancelados: bookings.filter(b => b.status === 'cancelled').length,
      no_shows: bookings.filter(b => b.status === 'no_show').length,
      taxa_conclusao: `${Math.round((bookings.filter(b => b.status === 'completed').length / bookings.length) * 100)}%`
    };
  }

  private buildContextInfo(analytics: any, ownerName: string): string {
    return `\n\nContexto Atual:
Dono: ${ownerName}
Período: Última semana
Agendamentos: ${analytics.total_agendamentos}
Taxa de conclusão: ${analytics.taxa_conclusao}
Cancelamentos: ${analytics.cancelados}
No-shows: ${analytics.no_shows}`;
  }
}

export const auroraService = new AuroraService();
