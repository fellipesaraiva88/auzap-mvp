import { openai, AI_MODELS } from '../../config/openai.js';
import { logger } from '../../config/logger.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { bookingsService } from '../bookings/bookings.service.js';
import { contactsService } from '../contacts/contacts.service.js';
import { servicesService } from '../services/services.service.js';

interface AuroraContext {
  organizationId: string;
  ownerPhone: string;
  ownerName: string;
}

interface FullBusinessContext {
  organization_name: string;
  settings: {
    business_hours: any;
    services_config: any;
  };
  services: Array<{
    nome: string;
    categoria: string;
    preco: number;
    duracao?: number;
  }>;
  analytics: {
    total_agendamentos: number;
    receita_semana_cents: number;
    ticket_medio_cents: number;
    taxa_conclusao: string;
    servico_mais_vendido: string;
    completados: number;
    cancelados: number;
    no_shows: number;
  };
  pets_stats: {
    total_pets: number;
    especies: Record<string, number>;
    racas_comuns: string[];
  };
}

export class AuroraService {
  private systemPrompt = `Você é Aurora, Customer Success Manager e parceira estratégica de negócios do dono desta clínica veterinária/petshop.

CONHECIMENTO COMPLETO DO NEGÓCIO:
Você tem acesso total e profundo a TODOS os dados do negócio:
✓ Catálogo completo de serviços (preços, categorias, duração)
✓ Horários de funcionamento e configurações operacionais
✓ Base completa de clientes e pets (espécies, raças, histórico)
✓ Histórico completo de agendamentos e receita
✓ Métricas financeiras (receita, ticket médio, crescimento, comparações)
✓ Analytics em tempo real (cancelamentos, no-shows, taxa de conclusão)

SUAS CAPACIDADES COMO CUSTOMER SUCCESS:

1. RESPONDER PERGUNTAS ESPECÍFICAS sobre o negócio
   Exemplos que você DEVE saber responder:
   - "Quantos banhos fizemos em Yorkshires esta semana?"
   - "Qual o serviço mais vendido este mês?"
   - "Quanto custa uma consulta?"
   - "Estamos abertos sábado de manhã?"
   - "Quantos pets temos cadastrados?"

2. ANÁLISE FINANCEIRA PROATIVA
   - Calcule e compare receita entre períodos
   - Identifique crescimento ou queda
   - Analise ticket médio e sugira otimizações
   - Celebre marcos financeiros atingidos
   Exemplo: "Sua receita cresceu 15% vs semana passada! Chegou a R$ 12.500!"

3. IDENTIFICAÇÃO DE OPORTUNIDADES BASEADAS EM DADOS
   - Alerte sobre agendas vazias com tempo para preencher
   - Identifique clientes inativos para reativação
   - Sugira campanhas específicas baseadas em raças/serviços comuns
   - Detecte padrões de no-shows e sugira correções
   Exemplo: "Vi que você tem agenda vazia sexta à tarde. Que tal campanha de última hora para os 30 Yorkshires cadastrados?"

4. COMEMORAÇÃO DE METAS E ALERTAS DE PROBLEMAS
   - Comemore quando bater metas de receita/agendamentos
   - Alerte sobre aumentos de cancelamentos ou no-shows
   - Identifique tendências positivas ou negativas
   Exemplo: "🎉 Bateu meta de 50 agendamentos esta semana!"
   Exemplo: "⚠️ 3 no-shows hoje - vamos ajustar os lembretes?"

5. SUGESTÕES ESTRATÉGICAS E AUTOMAÇÕES
   - Sugira campanhas de marketing específicas
   - Identifique serviços subutilizados
   - Proponha otimizações de agenda e preços
   - Recomende ações baseadas em sazonalidade

ESTILO DE COMUNICAÇÃO:
- Conversacional mas profissional (como uma sócia próxima)
- Data-driven: SEMPRE cite números específicos e reais
- Proativa: sugira ações concretas baseadas em insights
- Específica: use nomes de serviços, raças, valores exatos
- Contextual: demonstre que você conhece o histórico do negócio

SEMPRE QUE RESPONDER:
✓ Cite números exatos (não arredonde demais)
✓ Use nomes específicos de serviços e categorias
✓ Mencione espécies/raças quando relevante
✓ Compare com períodos anteriores quando apropriado
✓ Sugira ação concreta ao identificar oportunidade

NUNCA:
✗ Responda dúvidas de clientes finais (você é EXCLUSIVA do dono)
✗ Invente dados ou estatísticas
✗ Execute ações sem confirmação do dono
✗ Seja genérica - sempre seja específica e baseada em dados reais`;

  /**
   * Processa mensagem do dono
   */
  async processOwnerMessage(context: AuroraContext, message: string): Promise<string> {
    try {
      logger.info({ organizationId: context.organizationId }, 'Processing owner message with Aurora');

      // Buscar contexto completo do negócio
      const fullContext = await this.getFullBusinessContext(context.organizationId);

      // Construir mensagens
      const messages: any[] = [
        {
          role: 'system',
          content: this.systemPrompt + '\n\n' + this.buildContextInfo(fullContext, context.ownerName)
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
   * Gera resumo diário automático (incluindo novos verticals: Training, Daycare, Knowledge Base)
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

      // Estatísticas de agendamentos
      const completed = todayBookings.filter(b => b.status === 'completed').length;
      const cancelled = todayBookings.filter(b => b.status === 'cancelled').length;
      const noShow = todayBookings.filter(b => b.status === 'no_show').length;

      // NOVOS VERTICALS - Training Plans
      const { count: activeTrainingPlans } = await supabaseAdmin
        .from('training_plans')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'ativo');

      // NOVOS VERTICALS - Daycare/Hotel
      const { data: todayCheckIns } = await supabaseAdmin
        .from('daycare_hotel_stays')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('check_in_date', today.toISOString())
        .lt('check_in_date', tomorrow.toISOString());

      const { data: todayCheckOuts } = await supabaseAdmin
        .from('daycare_hotel_stays')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('check_out_date', today.toISOString())
        .lt('check_out_date', tomorrow.toISOString());

      // Construir mensagem
      let summary = `📊 *Resumo do Dia* - ${today.toLocaleDateString('pt-BR')}\n\n`;

      summary += `*Agendamentos Hoje:*\n`;
      summary += `✅ Completados: ${completed}\n`;
      summary += `❌ Cancelamentos: ${cancelled}\n`;
      summary += `⚠️ No-shows: ${noShow}\n`;
      summary += `📋 Total: ${todayBookings.length}\n\n`;

      summary += `*Amanhã:*\n`;
      summary += `📅 ${tomorrowBookings.length} agendamentos previstos\n\n`;

      // Novos Verticals Summary
      summary += `*🎓 Treinamento:*\n`;
      summary += `${activeTrainingPlans || 0} planos ativos\n\n`;

      summary += `*🏨 Hospedagem/Daycare:*\n`;
      summary += `Check-ins hoje: ${todayCheckIns?.length || 0}\n`;
      summary += `Check-outs hoje: ${todayCheckOuts?.length || 0}\n\n`;

      // Alertas
      if (noShow > 0) {
        summary += `⚠️ *Atenção:* ${noShow} no-show(s) hoje. Considere lembretes mais próximos do horário.\n\n`;
      }

      if (tomorrowBookings.length < 5) {
        summary += `💡 *Oportunidade:* Agenda amanhã com ${tomorrowBookings.length} agendamentos. Campanha de última hora?\n`;
      }

      return summary;
    } catch (error) {
      logger.error({ error }, 'Error generating daily summary');
      return 'Erro ao gerar resumo diário';
    }
  }

  /**
   * Identifica oportunidades de negócio (incluindo novos verticals: Training, Daycare, Knowledge Base)
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

      // Oportunidade: Planos de Adestramento (Training)
      const { data: petsWithoutTraining } = await supabaseAdmin
        .from('pets')
        .select('id, name, contact_id')
        .eq('organization_id', organizationId)
        .is('deleted_at', null);

      if (petsWithoutTraining && petsWithoutTraining.length > 0) {
        const { count: trainingPlansCount } = await supabaseAdmin
          .from('training_plans')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status', 'ativo');

        const petsWithoutActivePlan = petsWithoutTraining.length - (trainingPlansCount || 0);

        if (petsWithoutActivePlan > 5) {
          opportunities.push(
            `🎓 ${petsWithoutActivePlan} pets sem plano de adestramento ativo. Campanha de treinamento comportamental?`
          );
        }
      }

      // Oportunidade: Hospedagem/Daycare (próximo feriado/verão)
      const { data: daycareStays } = await supabaseAdmin
        .from('daycare_hotel_stays')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('check_in_date', new Date().toISOString())
        .lte('check_in_date', threeDaysAhead.toISOString());

      if (!daycareStays || daycareStays.length < 3) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        opportunities.push(
          `🏨 Apenas ${daycareStays?.length || 0} reservas de hospedagem nos próximos 3 dias. Feriados chegando - promover daycare/hotel?`
        );
      }

      // Oportunidade: Base de Conhecimento subutilizada
      const { count: kbEntriesCount } = await supabaseAdmin
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if ((kbEntriesCount || 0) < 10) {
        opportunities.push(
          `📚 Base de conhecimento tem apenas ${kbEntriesCount || 0} entradas. Adicionar FAQs reduz tempo de resposta da IA!`
        );
      }

      return opportunities;
    } catch (error) {
      logger.error({ error }, 'Error identifying opportunities');
      return [];
    }
  }

  // Métodos privados

  /**
   * Busca contexto completo do negócio para Aurora
   */
  private async getFullBusinessContext(organizationId: string): Promise<FullBusinessContext> {
    try {
      // 1. Buscar organização e settings
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

      const { data: settings } = await supabaseAdmin
        .from('organization_settings')
        .select('business_hours, services_config')
        .eq('organization_id', organizationId)
        .single();

      // 2. Buscar serviços
      const services = await servicesService.listByOrganization(organizationId);
      const serviceStats = await servicesService.getStats(organizationId);

      // 3. Buscar analytics da semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const bookings = await bookingsService.listByOrganization(organizationId, {
        startDate: weekAgo.toISOString()
      });

      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalRevenue = await servicesService.getRevenue(
        organizationId,
        weekAgo,
        new Date()
      );

      const revenueSum = totalRevenue.reduce((sum, r) => sum + r.total_revenue_cents, 0);
      const ticketMedio = completedBookings.length > 0
        ? Math.round(revenueSum / completedBookings.length)
        : 0;

      // 4. Buscar estatísticas de pets
      const { data: pets } = await supabaseAdmin
        .from('pets')
        .select('species, breed')
        .eq('organization_id', organizationId);

      const especiesCount: Record<string, number> = {};
      const racasCount: Record<string, number> = {};

      pets?.forEach(pet => {
        especiesCount[pet.species] = (especiesCount[pet.species] || 0) + 1;
        if (pet.breed) {
          racasCount[pet.breed] = (racasCount[pet.breed] || 0) + 1;
        }
      });

      const racasComuns = Object.entries(racasCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([raca]) => raca);

      // 5. Montar contexto completo
      return {
        organization_name: org?.name || 'Seu negócio',
        settings: {
          business_hours: settings?.business_hours || {},
          services_config: settings?.services_config || {}
        },
        services: services.map(s => ({
          nome: s.name,
          categoria: s.type,
          preco: s.price_cents,
          duracao: s.duration_minutes || undefined
        })),
        analytics: {
          total_agendamentos: bookings.length,
          receita_semana_cents: revenueSum,
          ticket_medio_cents: ticketMedio,
          taxa_conclusao: bookings.length > 0
            ? `${Math.round((completedBookings.length / bookings.length) * 100)}%`
            : '0%',
          servico_mais_vendido: serviceStats.top_services[0]?.name || 'N/A',
          completados: completedBookings.length,
          cancelados: bookings.filter(b => b.status === 'cancelled').length,
          no_shows: bookings.filter(b => b.status === 'no_show').length
        },
        pets_stats: {
          total_pets: pets?.length || 0,
          especies: especiesCount,
          racas_comuns: racasComuns
        }
      };
    } catch (error) {
      logger.error({ error, organizationId }, 'Error fetching full business context');
      // Retornar contexto vazio em caso de erro
      return {
        organization_name: 'Seu negócio',
        settings: { business_hours: {}, services_config: {} },
        services: [],
        analytics: {
          total_agendamentos: 0,
          receita_semana_cents: 0,
          ticket_medio_cents: 0,
          taxa_conclusao: '0%',
          servico_mais_vendido: 'N/A',
          completados: 0,
          cancelados: 0,
          no_shows: 0
        },
        pets_stats: {
          total_pets: 0,
          especies: {},
          racas_comuns: []
        }
      };
    }
  }

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
      },
      {
        name: 'buscar_servicos',
        description: 'Lista todos os serviços oferecidos pela loja ou filtra por categoria',
        parameters: {
          type: 'object',
          properties: {
            categoria: {
              type: 'string',
              enum: ['grooming', 'consultation', 'vaccination', 'surgery', 'all'],
              description: 'Categoria de serviço (opcional, padrão: all)'
            }
          }
        }
      },
      {
        name: 'buscar_pets',
        description: 'Busca informações sobre pets cadastrados, filtrados por espécie ou raça',
        parameters: {
          type: 'object',
          properties: {
            especie: {
              type: 'string',
              description: 'Espécie do pet (ex: cachorro, gato)'
            },
            raca: {
              type: 'string',
              description: 'Raça específica'
            }
          }
        }
      },
      {
        name: 'calcular_metricas_financeiras',
        description: 'Calcula receita, ticket médio e crescimento do negócio',
        parameters: {
          type: 'object',
          properties: {
            periodo: {
              type: 'string',
              enum: ['hoje', 'semana', 'mes', 'ano'],
              description: 'Período para cálculo'
            },
            comparar_com_anterior: {
              type: 'boolean',
              description: 'Comparar com período anterior (padrão: true)'
            }
          },
          required: ['periodo']
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

      case 'buscar_servicos': {
        const categoria = args.categoria || 'all';
        if (categoria === 'all') {
          const services = await servicesService.listByOrganization(organizationId);
          return {
            total: services.length,
            servicos: services.map(s => ({
              nome: s.name,
              categoria: s.type,
              preco_reais: (s.price_cents / 100).toFixed(2),
              duracao_min: s.duration_minutes || 'N/A'
            }))
          };
        } else {
          const services = await servicesService.getByCategory(organizationId, categoria);
          return {
            categoria,
            total: services.length,
            servicos: services.map(s => ({
              nome: s.name,
              preco_reais: (s.price_cents / 100).toFixed(2),
              duracao_min: s.duration_minutes || 'N/A'
            }))
          };
        }
      }

      case 'buscar_pets': {
        let query = supabaseAdmin
          .from('pets')
          .select('name, species, breed, age_years')
          .eq('organization_id', organizationId);

        if (args.especie) {
          query = query.ilike('species', args.especie);
        }

        if (args.raca) {
          query = query.ilike('breed', `%${args.raca}%`);
        }

        const { data: pets } = await query.limit(20);

        return {
          total: pets?.length || 0,
          filtros: {
            especie: args.especie || 'todos',
            raca: args.raca || 'todas'
          },
          pets: pets?.map(p => ({
            nome: p.name,
            especie: p.species,
            raca: p.breed || 'SRD',
            idade: p.age_years ? `${p.age_years} anos` : 'N/A'
          })) || []
        };
      }

      case 'calcular_metricas_financeiras': {
        const periodo = args.periodo;
        const compararComAnterior = args.comparar_com_anterior !== false;

        // Calcular datas do período atual
        const now = new Date();
        let startDate = new Date(now);
        let endDate = new Date(now);

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

        // Buscar receita do período atual
        const currentRevenue = await servicesService.getRevenue(
          organizationId,
          startDate,
          endDate
        );

        const receitaAtual = currentRevenue.reduce((sum, r) => sum + r.total_revenue_cents, 0);
        const bookingsAtuais = currentRevenue.reduce((sum, r) => sum + r.total_bookings, 0);
        const ticketMedio = bookingsAtuais > 0 ? receitaAtual / bookingsAtuais : 0;

        const result: any = {
          periodo,
          receita_total_reais: (receitaAtual / 100).toFixed(2),
          total_agendamentos: bookingsAtuais,
          ticket_medio_reais: (ticketMedio / 100).toFixed(2),
          top_servicos: currentRevenue.slice(0, 3).map(r => ({
            servico: r.service_name,
            receita_reais: (r.total_revenue_cents / 100).toFixed(2),
            agendamentos: r.total_bookings
          }))
        };

        // Comparar com período anterior se solicitado
        if (compararComAnterior) {
          const diffMillis = endDate.getTime() - startDate.getTime();
          const previousStartDate = new Date(startDate.getTime() - diffMillis);
          const previousEndDate = new Date(startDate.getTime());

          const previousRevenue = await servicesService.getRevenue(
            organizationId,
            previousStartDate,
            previousEndDate
          );

          const receitaAnterior = previousRevenue.reduce((sum, r) => sum + r.total_revenue_cents, 0);
          const bookingsAnteriores = previousRevenue.reduce((sum, r) => sum + r.total_bookings, 0);

          const crescimentoReceita = receitaAnterior > 0
            ? ((receitaAtual - receitaAnterior) / receitaAnterior) * 100
            : 0;

          const crescimentoBookings = bookingsAnteriores > 0
            ? ((bookingsAtuais - bookingsAnteriores) / bookingsAnteriores) * 100
            : 0;

          result.comparacao = {
            receita_periodo_anterior_reais: (receitaAnterior / 100).toFixed(2),
            crescimento_receita_percentual: crescimentoReceita.toFixed(1) + '%',
            crescimento_bookings_percentual: crescimentoBookings.toFixed(1) + '%'
          };
        }

        return result;
      }

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

  private buildContextInfo(fullContext: FullBusinessContext, ownerName: string): string {
    const { organization_name, settings, services, analytics, pets_stats } = fullContext;

    // Formatar horários de funcionamento
    const formatBusinessHours = (hours: any): string => {
      if (!hours || Object.keys(hours).length === 0) {
        return 'Não configurado';
      }
      return Object.entries(hours)
        .map(([dia, horario]) => `${dia}: ${horario}`)
        .join(', ');
    };

    // Formatar serviços
    const servicosFormatados = services.length > 0
      ? services.map(s =>
          `- ${s.nome} (${s.categoria}): R$ ${(s.preco / 100).toFixed(2)}${s.duracao ? ` - ${s.duracao}min` : ''}`
        ).join('\n')
      : '- Nenhum serviço cadastrado';

    // Formatar espécies
    const especiesFormatadas = Object.keys(pets_stats.especies).length > 0
      ? Object.entries(pets_stats.especies)
          .map(([especie, count]) => `${especie}: ${count}`)
          .join(', ')
      : 'Nenhum pet cadastrado';

    return `\n\n===== CONTEXTO COMPLETO DO NEGÓCIO =====

ORGANIZAÇÃO: ${organization_name}
DONO: ${ownerName}

CONFIGURAÇÕES:
- Horários de funcionamento: ${formatBusinessHours(settings.business_hours)}

SERVIÇOS OFERECIDOS (${services.length} total):
${servicosFormatados}

ANALYTICS - ÚLTIMA SEMANA:
- Agendamentos totais: ${analytics.total_agendamentos}
- Agendamentos completados: ${analytics.completados}
- Cancelamentos: ${analytics.cancelados}
- No-shows: ${analytics.no_shows}
- Taxa de conclusão: ${analytics.taxa_conclusao}
- Receita da semana: R$ ${(analytics.receita_semana_cents / 100).toFixed(2)}
- Ticket médio: R$ ${(analytics.ticket_medio_cents / 100).toFixed(2)}
- Serviço mais vendido: ${analytics.servico_mais_vendido}

BASE DE CLIENTES E PETS:
- Total de pets cadastrados: ${pets_stats.total_pets}
- Distribuição por espécie: ${especiesFormatadas}
- Raças mais comuns: ${pets_stats.racas_comuns.length > 0 ? pets_stats.racas_comuns.join(', ') : 'N/A'}

=========================================`;
  }
}

export const auroraService = new AuroraService();
