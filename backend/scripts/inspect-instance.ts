#!/usr/bin/env ts-node
/**
 * Instance Inspector
 *
 * Exibe informações detalhadas sobre uma instância WhatsApp
 *
 * Uso:
 * npm run whatsapp:inspect <instanceId>
 *
 * Exemplo:
 * npm run whatsapp:inspect inst-456
 */

import { supabase } from '../src/config/supabase';

async function inspectInstance() {
  try {
    const instanceId = process.argv[2];

    if (!instanceId) {
      console.error(`
❌ ID da instância não fornecido!

Uso: npm run whatsapp:inspect <instanceId>

Exemplo:
  npm run whatsapp:inspect inst-456
      `);
      process.exit(1);
    }

    console.log(`
🔍 Inspecionando Instância WhatsApp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ID: ${instanceId}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Buscar dados da instância
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      throw new Error(`Instância não encontrada: ${instanceError?.message || 'Unknown'}`);
    }

    // Buscar mensagens
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('whatsapp_instance_id', instanceId);

    // Buscar mensagens de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('whatsapp_instance_id', instanceId)
      .gte('created_at', today.toISOString());

    // Buscar última mensagem
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('created_at, direction, status')
      .eq('whatsapp_instance_id', instanceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Formatar status
    const statusEmoji = {
      connected: '✅',
      connecting: '🔄',
      disconnected: '❌',
      qr_pending: '⚠️',
      error: '🔴'
    }[instance.status] || '❓';

    // Calcular uptime
    const connectedAt = instance.last_connected_at ? new Date(instance.last_connected_at) : null;
    const uptime = connectedAt ? Math.floor((Date.now() - connectedAt.getTime()) / 1000 / 60) : 0;

    console.log(`
📊 Informações da Instância
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Identificação:
  Nome:            ${instance.name || 'Sem nome'}
  ID:              ${instance.id}
  Organização:     ${instance.organization_id}

📱 Conexão:
  Status:          ${statusEmoji} ${instance.status.toUpperCase()}
  Telefone:        ${instance.phone_number || 'Não configurado'}
  Última Conexão:  ${instance.last_connected_at || 'Nunca conectado'}
  Uptime:          ${uptime > 0 ? `${uptime} minutos` : 'N/A'}

💬 Mensagens:
  Total:           ${messageCount || 0}
  Hoje:            ${todayMessages || 0}
  Última:          ${lastMessage ? `${lastMessage.direction} - ${lastMessage.created_at}` : 'Nenhuma mensagem'}

🔧 Configuração:
  QR Code:         ${instance.qr_code ? 'Disponível' : 'Não gerado'}
  Pairing Code:    ${instance.pairing_code || 'Não gerado'}
  Session Data:    ${instance.session_data ? 'Configurado' : 'Não configurado'}

📅 Datas:
  Criado em:       ${instance.created_at}
  Atualizado em:   ${instance.updated_at}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Se tiver pairing code ativo, mostrar
    if (instance.pairing_code && instance.pairing_code_expires_at) {
      const expiresAt = new Date(instance.pairing_code_expires_at);
      const isExpired = expiresAt < new Date();

      console.log(`
🔐 Pairing Code Ativo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Código:          ${instance.pairing_code}
  Expira em:       ${instance.pairing_code_expires_at}
  Status:          ${isExpired ? '❌ Expirado' : '✅ Válido'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    }

  } catch (error: any) {
    console.error(`
❌ Erro ao inspecionar instância!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Erro: ${error.message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    process.exit(1);
  }
}

inspectInstance();
