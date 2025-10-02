#!/usr/bin/env ts-node
/**
 * WhatsApp Dashboard CLI
 *
 * Dashboard em tempo real com estatísticas de todas as instâncias
 *
 * Uso:
 * npm run whatsapp:dashboard [orgId]
 *
 * Exemplo:
 * npm run whatsapp:dashboard
 * npm run whatsapp:dashboard org-123
 */

import { supabase } from '../src/config/supabase';

interface InstanceStats {
  id: string;
  name: string;
  status: string;
  phone_number: string | null;
  organization_id: string;
  last_connected_at: string | null;
  messageCount: number;
  todayMessages: number;
}

async function drawDashboard() {
  try {
    const orgId = process.argv[2];

    console.clear();
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                 📱 WhatsApp Instances Dashboard 📱                ║
╚═══════════════════════════════════════════════════════════════════╝
    `);

    // Buscar instâncias
    let query = supabase
      .from('whatsapp_instances')
      .select('*');

    if (orgId) {
      query = query.eq('organization_id', orgId);
      console.log(`🏢 Organização: ${orgId}\n`);
    }

    const { data: instances, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar instâncias: ${error.message}`);
    }

    if (!instances || instances.length === 0) {
      console.log(`
⚠️  Nenhuma instância encontrada!

💡 Dica: Crie uma instância primeiro ou verifique o ID da organização.
      `);
      return;
    }

    // Estatísticas agregadas
    const totalInstances = instances.length;
    const connectedInstances = instances.filter(i => i.status === 'connected').length;
    const disconnectedInstances = instances.filter(i => i.status === 'disconnected').length;
    const pendingInstances = instances.filter(i => i.status === 'qr_pending').length;

    // Buscar mensagens de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: totalMessagesToday } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Calcular mensagens por hora (média)
    const hoursElapsed = (Date.now() - today.getTime()) / 1000 / 60 / 60;
    const messagesPerHour = hoursElapsed > 0 ? (totalMessagesToday || 0) / hoursElapsed : 0;

    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                          📊 Resumo Geral                          ║
╠═══════════════════════════════════════════════════════════════════╣
║  Total de Instâncias:        ${totalInstances.toString().padEnd(36)}║
║  ✅ Conectadas:              ${connectedInstances.toString().padEnd(36)}║
║  ❌ Desconectadas:           ${disconnectedInstances.toString().padEnd(36)}║
║  ⚠️  Aguardando QR:          ${pendingInstances.toString().padEnd(36)}║
║                                                                   ║
║  💬 Mensagens Hoje:          ${(totalMessagesToday || 0).toString().padEnd(36)}║
║  📈 Mensagens/Hora:          ${messagesPerHour.toFixed(1).padEnd(36)}║
╚═══════════════════════════════════════════════════════════════════╝
    `);

    // Detalhes de cada instância
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                      📋 Instâncias Detalhadas                     ║
╚═══════════════════════════════════════════════════════════════════╝
    `);

    const statsPromises = instances.map(async (instance): Promise<InstanceStats> => {
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('whatsapp_instance_id', instance.id);

      const { count: todayMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('whatsapp_instance_id', instance.id)
        .gte('created_at', today.toISOString());

      return {
        id: instance.id,
        name: instance.name || 'Sem nome',
        status: instance.status,
        phone_number: instance.phone_number,
        organization_id: instance.organization_id,
        last_connected_at: instance.last_connected_at,
        messageCount: messageCount || 0,
        todayMessages: todayMessages || 0,
      };
    });

    const stats = await Promise.all(statsPromises);

    // Desenhar tabela
    console.log('┌─────────────────────┬──────────────────┬─────────────┬───────────┐');
    console.log('│ Nome                │ Status           │ Mensagens   │ Hoje      │');
    console.log('├─────────────────────┼──────────────────┼─────────────┼───────────┤');

    stats.forEach((stat) => {
      const statusEmoji = {
        connected: '✅',
        connecting: '🔄',
        disconnected: '❌',
        qr_pending: '⚠️',
        error: '🔴'
      }[stat.status] || '❓';

      const name = stat.name.substring(0, 18).padEnd(19);
      const status = `${statusEmoji} ${stat.status}`.substring(0, 15).padEnd(16);
      const messages = stat.messageCount.toString().padEnd(11);
      const today = stat.todayMessages.toString().padEnd(9);

      console.log(`│ ${name} │ ${status} │ ${messages} │ ${today} │`);
    });

    console.log('└─────────────────────┴──────────────────┴─────────────┴───────────┘');

    // Informações adicionais
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                      ℹ️  Informações Adicionais                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `);

    stats.forEach((stat) => {
      const uptime = stat.last_connected_at
        ? Math.floor((Date.now() - new Date(stat.last_connected_at).getTime()) / 1000 / 60)
        : 0;

      console.log(`
  📱 ${stat.name}
  ────────────────────────────────────────
  ID:          ${stat.id}
  Telefone:    ${stat.phone_number || 'Não configurado'}
  Status:      ${stat.status}
  Uptime:      ${uptime > 0 ? `${uptime} min` : 'N/A'}
  Mensagens:   ${stat.messageCount} (${stat.todayMessages} hoje)
      `);
    });

    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  💡 Dica: Execute 'npm run whatsapp:inspect <id>' para detalhes  ║
╚═══════════════════════════════════════════════════════════════════╝

  Última atualização: ${new Date().toLocaleString('pt-BR')}
    `);

  } catch (error: any) {
    console.error(`
❌ Erro ao gerar dashboard!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Erro: ${error.message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    process.exit(1);
  }
}

drawDashboard();
