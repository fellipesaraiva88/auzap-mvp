#!/usr/bin/env ts-node
/**
 * List Instances
 *
 * Lista todas as instâncias WhatsApp de forma simples
 *
 * Uso:
 * npm run whatsapp:list [orgId]
 */

import { supabase } from '../src/config/supabase';

async function listInstances() {
  try {
    const orgId = process.argv[2];

    let query = supabase
      .from('whatsapp_instances')
      .select('id, name, status, phone_number, organization_id, created_at')
      .order('created_at', { ascending: false });

    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data: instances, error } = await query;

    if (error) throw error;

    if (!instances || instances.length === 0) {
      console.log(`
⚠️  Nenhuma instância encontrada!
      `);
      return;
    }

    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    📱 WhatsApp Instances List                     ║
╚═══════════════════════════════════════════════════════════════════╝
${orgId ? `\n🏢 Organização: ${orgId}\n` : ''}
Total: ${instances.length} instâncias
    `);

    console.log('┌────────────────────────────────┬───────────────┬─────────────────────┐');
    console.log('│ Nome                           │ Status        │ Telefone            │');
    console.log('├────────────────────────────────┼───────────────┼─────────────────────┤');

    instances.forEach((instance) => {
      const statusEmoji = {
        connected: '✅',
        connecting: '🔄',
        disconnected: '❌',
        qr_pending: '⚠️',
        error: '🔴'
      }[instance.status] || '❓';

      const name = (instance.name || 'Sem nome').substring(0, 28).padEnd(30);
      const status = `${statusEmoji} ${instance.status}`.substring(0, 12).padEnd(13);
      const phone = (instance.phone_number || 'Não configurado').substring(0, 18).padEnd(19);

      console.log(`│ ${name} │ ${status} │ ${phone} │`);
    });

    console.log('└────────────────────────────────┴───────────────┴─────────────────────┘');

    console.log(`
💡 Para mais detalhes: npm run whatsapp:inspect <instance-id>
    `);

  } catch (error: any) {
    console.error(`
❌ Erro ao listar instâncias!
  Erro: ${error.message}
    `);
    process.exit(1);
  }
}

listInstances();
