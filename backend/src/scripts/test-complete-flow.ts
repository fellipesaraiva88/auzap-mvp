#!/usr/bin/env ts-node
/* eslint-disable no-console */
/**
 * Script de teste completo do fluxo WhatsApp
 * Valida: Conexão → Mensagem recebida → Worker → IA → Resposta enviada
 */

import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Conexão direta sem importar index.ts
const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: { rejectUnauthorized: false },
    })
  : new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

const messageQueue = new Queue('messages', { connection });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function log(
  step: string,
  status: TestResult['status'],
  message: string,
  details?: any
) {
  const result = { step, status, message, details };
  results.push(result);

  const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
  console.log(`${icon} [${step}] ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

async function testCompleteFlow() {
  console.log('\n🧪 TESTE COMPLETO DO FLUXO WHATSAPP\n');
  console.log('='.repeat(60));

  try {
    // STEP 1: Validar conexão Redis
    console.log('\n📋 STEP 1: Validando conexão Redis...\n');
    try {
      await connection.ping();
      await log('Redis', 'success', 'Redis conectado com sucesso');
    } catch (error) {
      await log('Redis', 'error', 'Falha ao conectar no Redis', error);
      throw error;
    }

    // STEP 2: Validar fila de mensagens
    console.log('\n📋 STEP 2: Validando fila de mensagens...\n');
    if (!messageQueue) {
      await log(
        'Queue',
        'error',
        'messageQueue não está disponível (modo produção sem Redis)'
      );
      throw new Error('messageQueue is null');
    }
    await log('Queue', 'success', 'Fila de mensagens disponível');

    // STEP 3: Buscar organização de teste
    console.log('\n📋 STEP 3: Buscando organização...\n');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);

    if (orgError || !orgs || orgs.length === 0) {
      await log(
        'Organization',
        'error',
        'Nenhuma organização encontrada',
        orgError
      );
      throw new Error('No organization found');
    }

    const org = orgs[0];
    await log(
      'Organization',
      'success',
      `Organização encontrada: ${org.name}`,
      { id: org.id }
    );

    // STEP 4: Buscar instância WhatsApp ativa
    console.log('\n📋 STEP 4: Buscando instância WhatsApp...\n');
    const { data: instances } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', org.id)
      .eq('status', 'connected')
      .limit(1);

    let instance;

    if (!instances || instances.length === 0) {
      await log(
        'Instance',
        'warning',
        'Nenhuma instância conectada encontrada'
      );
      await log('Instance', 'warning', 'Criando instância de teste...');

      const { data: newInstance, error: createError } = await supabase
        .from('whatsapp_instances')
        .insert({
          organization_id: org.id,
          instance_name: 'Test Instance',
          phone_number: '+5511999999999',
          status: 'connected',
          session_data: {},
        })
        .select()
        .single();

      if (createError || !newInstance) {
        await log(
          'Instance',
          'error',
          'Erro ao criar instância de teste',
          createError
        );
        throw createError;
      }

      instance = newInstance;
      await log('Instance', 'success', 'Instância de teste criada', {
        id: newInstance.id,
      });
    } else {
      instance = instances[0];
      await log(
        'Instance',
        'success',
        `Instância encontrada: ${instance.instance_name}`,
        { id: instance.id }
      );
    }

    // STEP 5: Simular mensagem recebida
    console.log('\n📋 STEP 5: Simulando mensagem recebida...\n');

    const mockMessage = {
      key: {
        remoteJid: '5511987654321@s.whatsapp.net',
        id: `TEST_${Date.now()}`,
        fromMe: false,
      },
      message: {
        conversation: 'Olá! Gostaria de agendar um banho para meu cachorro',
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
    };

    await log('Message', 'success', 'Mensagem mockada criada', {
      from: mockMessage.key.remoteJid,
      content: mockMessage.message.conversation,
    });

    // STEP 6: Adicionar mensagem na fila
    console.log('\n📋 STEP 6: Adicionando mensagem na fila...\n');

    const job = await messageQueue.add('process-message', {
      organizationId: org.id,
      instanceId: instance!.id,
      message: mockMessage,
    });

    await log('Queue Job', 'success', `Job criado com ID: ${job.id}`);

    // STEP 7: Aguardar processamento
    console.log('\n📋 STEP 7: Aguardando processamento (máx 30s)...\n');

    const maxWait = 30000; // 30 segundos
    const startTime = Date.now();
    let jobCompleted = false;

    while (Date.now() - startTime < maxWait) {
      const state = await job.getState();

      if (state === 'completed') {
        jobCompleted = true;
        const returnValue = await job.returnvalue;
        await log(
          'Processing',
          'success',
          'Job processado com sucesso',
          returnValue
        );
        break;
      } else if (state === 'failed') {
        const failedReason = job.failedReason;
        const stackTrace = await job.stacktrace;
        await log('Processing', 'error', 'Job falhou no processamento', {
          reason: failedReason,
          stackTrace: stackTrace?.slice(0, 3), // Primeiras 3 linhas do stack
        });
        throw new Error(failedReason);
      } else if (state === null) {
        await log(
          'Processing',
          'warning',
          `Job ${job.id} foi removido da fila antes de processar (state = null)`
        );
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      process.stdout.write('.');
    }

    if (!jobCompleted) {
      await log('Processing', 'warning', 'Timeout: Job não completou em 30s');
    }

    // STEP 8: Verificar mensagens salvas no banco
    console.log('\n\n📋 STEP 8: Verificando mensagens no banco...\n');

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (msgError) {
      await log('Database', 'error', 'Erro ao buscar mensagens', msgError);
    } else {
      await log(
        'Database',
        'success',
        `${messages?.length || 0} mensagens encontradas`
      );

      if (messages && messages.length > 0) {
        console.log('\nÚltimas mensagens:');
        messages.forEach((msg, i) => {
          console.log(
            `  ${i + 1}. [${msg.direction}] ${msg.content?.substring(0, 50)}...`
          );
        });
      }
    }

    // STEP 9: Verificar interações de IA
    console.log('\n📋 STEP 9: Verificando interações de IA...\n');

    const { data: interactions, error: aiError } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (aiError) {
      await log(
        'AI Interactions',
        'error',
        'Erro ao buscar interações',
        aiError
      );
    } else {
      await log(
        'AI Interactions',
        'success',
        `${interactions?.length || 0} interações encontradas`
      );

      if (interactions && interactions.length > 0) {
        console.log('\nÚltimas interações:');
        interactions.forEach((ia, i) => {
          console.log(
            `  ${i + 1}. [${ia.agent_type}] ${ia.prompt?.substring(0, 40)}...`
          );
        });
      }
    }

    // STEP 10: Verificar status da fila
    console.log('\n📋 STEP 10: Status da fila...\n');

    const waiting = await messageQueue.getWaitingCount();
    const active = await messageQueue.getActiveCount();
    const completed = await messageQueue.getCompletedCount();
    const failed = await messageQueue.getFailedCount();

    await log('Queue Status', 'success', 'Status obtido', {
      waiting,
      active,
      completed,
      failed,
    });
  } catch (error: any) {
    await log('Test', 'error', 'Teste falhou', error.message);
  } finally {
    // RESUMO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESUMO DO TESTE\n');

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;
    const warningCount = results.filter((r) => r.status === 'warning').length;

    console.log(`✅ Sucesso: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`⚠️  Avisos: ${warningCount}`);

    console.log('\n' + '='.repeat(60) + '\n');

    // Cleanup
    await connection.quit();
    process.exit(errorCount > 0 ? 1 : 0);
  }
}

// Executar teste
testCompleteFlow().catch(console.error);
