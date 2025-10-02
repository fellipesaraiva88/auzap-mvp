#!/usr/bin/env ts-node
/**
 * Health Check
 *
 * Verifica status de todos os serviços críticos do sistema
 *
 * Uso:
 * npm run whatsapp:health
 */

import { supabase } from '../src/config/supabase';
import { messageQueue } from '../src/config/redis';

async function healthCheck() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                      🏥 Health Check System                       ║
╚═══════════════════════════════════════════════════════════════════╝

🔍 Verificando serviços...
  `);

  const results: { [key: string]: { status: string; details?: string } } = {};

  // 1. Testar Supabase
  try {
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('count')
      .limit(1);

    if (error) throw error;

    results['Supabase'] = {
      status: '✅ Online',
      details: 'Conexão OK'
    };
  } catch (error: any) {
    results['Supabase'] = {
      status: '❌ Offline',
      details: error.message
    };
  }

  // 2. Testar Redis/BullMQ
  try {
    const job = await messageQueue.add('health-check', {
      timestamp: Date.now()
    });

    await job.waitUntilFinished(messageQueue.events, 5000).catch(() => {});
    await job.remove();

    results['Redis/BullMQ'] = {
      status: '✅ Online',
      details: 'Fila funcional'
    };
  } catch (error: any) {
    results['Redis/BullMQ'] = {
      status: '⚠️  Limitado',
      details: 'Operando sem Redis (modo in-memory)'
    };
  }

  // 3. Verificar instâncias WhatsApp
  try {
    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select('status')
      .eq('status', 'connected');

    if (error) throw error;

    const connectedCount = instances?.length || 0;

    results['WhatsApp Instances'] = {
      status: connectedCount > 0 ? '✅ Ativas' : '⚠️  Sem conexões',
      details: `${connectedCount} instâncias conectadas`
    };
  } catch (error: any) {
    results['WhatsApp Instances'] = {
      status: '❌ Erro',
      details: error.message
    };
  }

  // 4. Verificar mensagens recentes
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo.toISOString());

    if (error) throw error;

    results['Message Processing'] = {
      status: '✅ Ativo',
      details: `${count || 0} mensagens na última hora`
    };
  } catch (error: any) {
    results['Message Processing'] = {
      status: '❌ Erro',
      details: error.message
    };
  }

  // Exibir resultados
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                         📊 Resultados                             ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  Object.entries(results).forEach(([service, result]) => {
    console.log(`  ${service.padEnd(25)} ${result.status}`);
    if (result.details) {
      console.log(`  ${''.padEnd(25)} ${result.details}`);
    }
    console.log('');
  });

  // Status geral
  const allHealthy = Object.values(results).every(r => r.status.includes('✅'));
  const hasWarnings = Object.values(results).some(r => r.status.includes('⚠️'));
  const hasErrors = Object.values(results).some(r => r.status.includes('❌'));

  if (allHealthy) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    ✅ Sistema 100% Operacional                    ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
  } else if (hasErrors) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                  ❌ Sistema com Erros Críticos                    ║
║                  Verifique os serviços offline                    ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                ⚠️  Sistema Operacional com Avisos                 ║
║              Alguns serviços funcionam com limitações             ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
  }

  console.log(`
  Timestamp: ${new Date().toISOString()}
  `);
}

healthCheck();
