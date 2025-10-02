import { Worker, Queue } from 'bullmq';
import { CronJob } from 'cron';
import { connection } from '../config/redis';
import { supabase } from '../config/supabase';
import { BaileysService } from '../services/baileys.service';
import { AuroraService } from '../services/aurora.service';
import { logger } from '../config/logger';

// Fila para mensagens proativas
export const auroraProactiveQueue = new Queue('aurora-proactive', { connection });

/**
 * Worker para processar mensagens proativas da Aurora
 */
const worker = new Worker(
  'aurora-proactive',
  async (job) => {
    const { type, organizationId, ownerNumberId, data } = job.data;

    try {
      logger.info({ jobId: job.id, type, organizationId }, 'Processing proactive message');

      switch (type) {
        case 'daily_summary':
          await processDailySummary(organizationId, ownerNumberId);
          break;
        case 'inactive_clients':
          await processInactiveClients(organizationId, ownerNumberId, data);
          break;
        case 'birthdays':
          await processBirthdays(organizationId, ownerNumberId);
          break;
        case 'opportunities':
          await processOpportunities(organizationId, ownerNumberId);
          break;
        case 'low_occupancy':
          await processLowOccupancy(organizationId, ownerNumberId);
          break;
        case 'custom_campaign':
          await processCustomCampaign(organizationId, ownerNumberId, data);
          break;
        default:
          logger.warn({ type }, 'Unknown proactive message type');
      }

      logger.info({ jobId: job.id, type }, 'Proactive message processed successfully');

      return { success: true, type };
    } catch (error: any) {
      logger.error({ error, jobId: job.id, type, organizationId }, 'Error processing proactive message');
      throw error;
    }
  },
  {
    connection,
    concurrency: 3,
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 1000 },
  }
);

/**
 * Processar resumo diário (enviado às 18h)
 */
async function processDailySummary(organizationId: string, ownerNumberId: string) {
  // Buscar dados do dia
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: bookingsToday, count: bookingsCount } = await supabase
    .from('bookings')
    .select('*, services(name, price), pets(name)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .gte('start_time', today.toISOString())
    .order('start_time', { ascending: true });

  const revenue = bookingsToday?.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;

  const { count: newClients } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', today.toISOString());

  const { count: pendingBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'pending');

  // Criar mensagem proativa via Aurora AI
  const summaryPrompt = `Crie um resumo diário amigável e motivador para o dono baseado nos dados:
- Agendamentos hoje: ${bookingsCount || 0}
- Receita hoje: R$ ${revenue.toFixed(2)}
- Novos clientes: ${newClients || 0}
- Agendamentos pendentes: ${pendingBookings || 0}

Lista de agendamentos de hoje:
${bookingsToday?.map((b) => `- ${b.pets?.name || 'Pet'} - ${b.services?.name || 'Serviço'} às ${new Date(b.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`).join('\n') || 'Nenhum agendamento'}

Tom: amigável, celebrando conquistas, oferecendo insights úteis. Use emojis com moderação.`;

  const message = await AuroraService.processOwnerMessage({
    organizationId,
    ownerNumberId,
    content: summaryPrompt,
    context: {
      isOwner: true,
      organizationId,
      ownerNumberId,
    },
  });

  // Salvar no banco
  const { data: proactiveMsg } = await supabase
    .from('aurora_proactive_messages')
    .insert({
      organization_id: organizationId,
      owner_number_id: ownerNumberId,
      message_type: 'daily_summary',
      content: message,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      metadata: {
        bookings_count: bookingsCount,
        revenue,
        new_clients: newClients,
        pending_bookings: pendingBookings,
      },
    })
    .select()
    .single();

  // Enviar via WhatsApp
  await sendProactiveMessage(organizationId, ownerNumberId, message, proactiveMsg.id);
}

/**
 * Processar clientes inativos
 */
async function processInactiveClients(organizationId: string, ownerNumberId: string, data: any) {
  const daysInactive = data?.days || 30;
  const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);

  const { data: inactiveContacts, count } = await supabase
    .from('contacts')
    .select('*, pets(name)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .lt('last_contact_at', cutoffDate.toISOString())
    .eq('status', 'active')
    .limit(10);

  if (!count || count === 0) {
    logger.info({ organizationId }, 'No inactive clients found');
    return;
  }

  const prompt = `Identifiquei ${count} clientes inativos há mais de ${daysInactive} dias.

Top 10 clientes inativos:
${inactiveContacts?.map((c) => `- ${c.name} (${c.phone}) - Pet: ${c.pets?.[0]?.name || 'Não cadastrado'}`).join('\n')}

Crie uma mensagem proativa sugerindo uma campanha de reativação. Ofereça insights e sugira ações concretas que o dono pode tomar.`;

  const message = await AuroraService.processOwnerMessage({
    organizationId,
    ownerNumberId,
    content: prompt,
    context: {
      isOwner: true,
      organizationId,
      ownerNumberId,
    },
  });

  const { data: proactiveMsg } = await supabase
    .from('aurora_proactive_messages')
    .insert({
      organization_id: organizationId,
      owner_number_id: ownerNumberId,
      message_type: 'inactive_clients',
      content: message,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      metadata: {
        inactive_count: count,
        days_inactive: daysInactive,
        sample_contacts: inactiveContacts?.slice(0, 5).map((c) => ({ id: c.id, name: c.name })),
      },
    })
    .select()
    .single();

  await sendProactiveMessage(organizationId, ownerNumberId, message, proactiveMsg.id);
}

/**
 * Processar aniversários do dia
 */
async function processBirthdays(organizationId: string, ownerNumberId: string) {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // Buscar pets com aniversário hoje
  const { data: birthdayPets, count } = await supabase
    .from('pets')
    .select('*, contacts(name, phone)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .not('birthday', 'is', null)
    .filter('birthday', 'like', `%-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`)
    .limit(10);

  if (!count || count === 0) {
    logger.info({ organizationId }, 'No birthdays today');
    return;
  }

  const prompt = `Hoje ${count} pets fazem aniversário!

Lista de aniversariantes:
${birthdayPets?.map((p) => `- ${p.name} (tutor: ${p.contacts?.name || 'Desconhecido'} - ${p.contacts?.phone})`).join('\n')}

Crie uma mensagem proativa sugerindo enviar mensagens de felicitações automáticas e ofertas especiais.`;

  const message = await AuroraService.processOwnerMessage({
    organizationId,
    ownerNumberId,
    content: prompt,
    context: {
      isOwner: true,
      organizationId,
      ownerNumberId,
    },
  });

  const { data: proactiveMsg } = await supabase
    .from('aurora_proactive_messages')
    .insert({
      organization_id: organizationId,
      owner_number_id: ownerNumberId,
      message_type: 'birthdays',
      content: message,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      metadata: {
        birthday_count: count,
        pets: birthdayPets?.map((p) => ({ id: p.id, name: p.name, contact_id: p.contact_id })),
      },
    })
    .select()
    .single();

  await sendProactiveMessage(organizationId, ownerNumberId, message, proactiveMsg.id);
}

/**
 * Processar oportunidades de negócio
 */
async function processOpportunities(organizationId: string, ownerNumberId: string) {
  // Buscar slots vazios nos próximos 3 dias
  const today = new Date();
  const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  const { data: bookingsNext3Days, count: bookingsCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .gte('start_time', today.toISOString())
    .lte('start_time', threeDaysLater.toISOString());

  // Buscar clientes que costumam agendar regularmente
  const { data: regularClients } = await supabase
    .from('contacts')
    .select('*, bookings(count)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('last_contact_at', { ascending: false })
    .limit(20);

  const prompt = `Análise de oportunidades para os próximos 3 dias:
- Agendamentos confirmados: ${bookingsCount || 0}
- Clientes regulares ativos: ${regularClients?.length || 0}

Sugira ações proativas para preencher a agenda:
1. Clientes que podem estar precisando de agendamento
2. Horários disponíveis que podem ser oferecidos
3. Promoções relâmpago para preencher horários vazios

Seja específico e acionável.`;

  const message = await AuroraService.processOwnerMessage({
    organizationId,
    ownerNumberId,
    content: prompt,
    context: {
      isOwner: true,
      organizationId,
      ownerNumberId,
    },
  });

  const { data: proactiveMsg } = await supabase
    .from('aurora_proactive_messages')
    .insert({
      organization_id: organizationId,
      owner_number_id: ownerNumberId,
      message_type: 'opportunities',
      content: message,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      metadata: {
        bookings_next_3_days: bookingsCount,
        regular_clients_count: regularClients?.length,
      },
    })
    .select()
    .single();

  await sendProactiveMessage(organizationId, ownerNumberId, message, proactiveMsg.id);
}

/**
 * Processar baixa ocupação (enviado quando agenda está vazia)
 */
async function processLowOccupancy(organizationId: string, ownerNumberId: string) {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const { count: bookingsTomorrow } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('start_time', tomorrow.toISOString())
    .lt('start_time', new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString());

  const { data: topClients } = await supabase
    .from('contacts')
    .select('*, bookings(count)')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('last_contact_at', { ascending: false })
    .limit(15);

  const prompt = `Alerta de baixa ocupação! Amanhã há apenas ${bookingsTomorrow || 0} agendamentos.

Sugira uma campanha urgente para preencher a agenda:
- Top 15 clientes que podem ser contatados
- Mensagem sugerida para envio em massa
- Oferta especial para preenchimento rápido

Seja persuasivo e crie senso de urgência.`;

  const message = await AuroraService.processOwnerMessage({
    organizationId,
    ownerNumberId,
    content: prompt,
    context: {
      isOwner: true,
      organizationId,
      ownerNumberId,
    },
  });

  const { data: proactiveMsg } = await supabase
    .from('aurora_proactive_messages')
    .insert({
      organization_id: organizationId,
      owner_number_id: ownerNumberId,
      message_type: 'low_occupancy',
      content: message,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      metadata: {
        bookings_tomorrow: bookingsTomorrow,
        suggested_contacts: topClients?.slice(0, 10).map((c) => ({ id: c.id, name: c.name })),
      },
    })
    .select()
    .single();

  await sendProactiveMessage(organizationId, ownerNumberId, message, proactiveMsg.id);
}

/**
 * Processar campanha personalizada
 */
async function processCustomCampaign(organizationId: string, ownerNumberId: string, data: any) {
  const { campaignType, targetAudience, message: customMessage } = data;

  // Buscar audiência alvo
  let query = supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active');

  if (targetAudience === 'inactive') {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    query = query.lt('last_contact_at', cutoffDate.toISOString());
  } else if (targetAudience === 'vip') {
    // Clientes com mais de 5 agendamentos
    query = query.gte('bookings_count', 5);
  }

  const { data: targetContacts, count } = await query.limit(50);

  const prompt = `Campanha personalizada solicitada:
- Tipo: ${campaignType}
- Audiência: ${targetAudience}
- Alcance: ${count || 0} contatos
- Mensagem base: ${customMessage || 'Não fornecida'}

Crie uma mensagem otimizada para esta campanha e sugira o melhor momento de envio.`;

  const message = await AuroraService.processOwnerMessage({
    organizationId,
    ownerNumberId,
    content: prompt,
    context: {
      isOwner: true,
      organizationId,
      ownerNumberId,
    },
  });

  const { data: proactiveMsg } = await supabase
    .from('aurora_proactive_messages')
    .insert({
      organization_id: organizationId,
      owner_number_id: ownerNumberId,
      message_type: 'custom_campaign',
      content: message,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      metadata: {
        campaign_type: campaignType,
        target_audience: targetAudience,
        target_count: count,
      },
    })
    .select()
    .single();

  await sendProactiveMessage(organizationId, ownerNumberId, message, proactiveMsg.id);
}

/**
 * Enviar mensagem proativa via WhatsApp
 */
async function sendProactiveMessage(
  organizationId: string,
  ownerNumberId: string,
  message: string,
  proactiveMessageId: string
) {
  try {
    // Buscar número do dono
    const { data: ownerNumber } = await supabase
      .from('owner_numbers')
      .select('*, whatsapp_instances(id, status)')
      .eq('id', ownerNumberId)
      .single();

    if (!ownerNumber || !ownerNumber.phone) {
      throw new Error('Owner number not found');
    }

    // Buscar instância ativa
    const activeInstance = ownerNumber.whatsapp_instances?.find((i: any) => i.status === 'connected');

    if (!activeInstance) {
      logger.warn({ organizationId, ownerNumberId }, 'No active WhatsApp instance found');

      await supabase
        .from('aurora_proactive_messages')
        .update({ status: 'failed', error_message: 'No active instance' })
        .eq('id', proactiveMessageId);

      return;
    }

    // Enviar mensagem
    await BaileysService.sendMessage(
      organizationId,
      activeInstance.id,
      ownerNumber.phone,
      message
    );

    // Atualizar status
    await supabase
      .from('aurora_proactive_messages')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', proactiveMessageId);

    logger.info({ proactiveMessageId }, 'Proactive message sent successfully');
  } catch (error: any) {
    logger.error({ error, proactiveMessageId }, 'Failed to send proactive message');

    await supabase
      .from('aurora_proactive_messages')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('id', proactiveMessageId);

    throw error;
  }
}

/**
 * Agendar jobs recorrentes
 */
export function setupProactiveSchedules() {
  // Resumo diário às 18h
  const dailySummaryJob = new CronJob('0 18 * * *', async () => {
    logger.info('Running daily summary cron');

    // Buscar todas as organizações com Aurora ativada
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, owner_numbers(id, aurora_enabled)')
      .eq('is_active', true);

    for (const org of organizations || []) {
      const enabledOwners = org.owner_numbers?.filter((o: any) => o.aurora_enabled);

      for (const owner of enabledOwners || []) {
        await auroraProactiveQueue.add('daily-summary', {
          type: 'daily_summary',
          organizationId: org.id,
          ownerNumberId: owner.id,
        });
      }
    }
  });

  // Aniversários diários às 9h
  const birthdaysJob = new CronJob('0 9 * * *', async () => {
    logger.info('Running birthdays cron');

    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, owner_numbers(id, aurora_enabled)')
      .eq('is_active', true);

    for (const org of organizations || []) {
      const enabledOwners = org.owner_numbers?.filter((o: any) => o.aurora_enabled);

      for (const owner of enabledOwners || []) {
        await auroraProactiveQueue.add('birthdays', {
          type: 'birthdays',
          organizationId: org.id,
          ownerNumberId: owner.id,
        });
      }
    }
  });

  // Clientes inativos toda segunda às 10h
  const inactiveClientsJob = new CronJob('0 10 * * 1', async () => {
    logger.info('Running inactive clients cron');

    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, owner_numbers(id, aurora_enabled)')
      .eq('is_active', true);

    for (const org of organizations || []) {
      const enabledOwners = org.owner_numbers?.filter((o: any) => o.aurora_enabled);

      for (const owner of enabledOwners || []) {
        await auroraProactiveQueue.add('inactive-clients', {
          type: 'inactive_clients',
          organizationId: org.id,
          ownerNumberId: owner.id,
          data: { days: 30 },
        });
      }
    }
  });

  // Oportunidades às terças e quintas às 15h
  const opportunitiesJob = new CronJob('0 15 * * 2,4', async () => {
    logger.info('Running opportunities cron');

    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, owner_numbers(id, aurora_enabled)')
      .eq('is_active', true);

    for (const org of organizations || []) {
      const enabledOwners = org.owner_numbers?.filter((o: any) => o.aurora_enabled);

      for (const owner of enabledOwners || []) {
        await auroraProactiveQueue.add('opportunities', {
          type: 'opportunities',
          organizationId: org.id,
          ownerNumberId: owner.id,
        });
      }
    }
  });

  dailySummaryJob.start();
  birthdaysJob.start();
  inactiveClientsJob.start();
  opportunitiesJob.start();

  logger.info('Proactive schedules set up successfully');

  return {
    dailySummaryJob,
    birthdaysJob,
    inactiveClientsJob,
    opportunitiesJob,
  };
}

// Event handlers
worker.on('completed', (job) => {
  logger.info({ jobId: job.id, type: job.data.type }, '✅ Proactive job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, type: job?.data.type, error: err }, '❌ Proactive job failed');
});

export default worker;
