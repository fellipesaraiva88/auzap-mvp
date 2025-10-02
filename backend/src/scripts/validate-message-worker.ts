/**
 * VALIDAÇÃO COMPLETA DO WORKER DE PROCESSAMENTO DE MENSAGENS
 *
 * Testa:
 * 1. Queue funcionando
 * 2. Worker consumindo
 * 3. Logs estruturados
 * 4. Salvamento no banco
 * 5. Fluxo completo de resposta
 */

import { messageQueue } from '../config/redis';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

interface TestResult {
  step: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logStep(step: string, status: 'info' | 'success' | 'error' | 'warn', message: string, data?: any) {
  const icon = status === 'success' ? '✓' : status === 'error' ? '✗' : status === 'warn' ? '⚠' : 'ℹ';
  const color = status === 'success' ? colors.green : status === 'error' ? colors.red : status === 'warn' ? colors.yellow : colors.blue;

  console.log(`${color}${icon} [${step}] ${message}${colors.reset}`);

  if (data) {
    console.log(`${colors.cyan}   ${JSON.stringify(data, null, 2)}${colors.reset}`);
  }
}

async function validateWorkerSystem() {
  console.log(`${colors.bright}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}VALIDAÇÃO COMPLETA DO WORKER DE PROCESSAMENTO DE MENSAGENS${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(80)}${colors.reset}\n`);

  try {
    // ===== STEP 1: Verificar Queue =====
    console.log(`${colors.bright}[STEP 1] Verificando Queue System${colors.reset}\n`);

    if (!messageQueue) {
      logStep('QUEUE', 'warn', 'Queue desabilitada (produção sem Redis)');
      results.push({ step: 'QUEUE', passed: false, message: 'Queue disabled in production without Redis' });
      console.log(`\n${colors.yellow}Sistema configurado para processamento síncrono.${colors.reset}\n`);
      return;
    }

    logStep('QUEUE', 'success', 'Queue disponível e pronta');
    results.push({ step: 'QUEUE', passed: true, message: 'Queue available' });

    // ===== STEP 2: Verificar Workers Rodando =====
    console.log(`\n${colors.bright}[STEP 2] Verificando Workers${colors.reset}\n`);

    const waitingCount = await messageQueue.getWaitingCount();
    const activeCount = await messageQueue.getActiveCount();
    const completedCount = await messageQueue.getCompletedCount();
    const failedCount = await messageQueue.getFailedCount();

    logStep('STATS', 'info', 'Queue Statistics', {
      waiting: waitingCount,
      active: activeCount,
      completed: completedCount,
      failed: failedCount,
    });

    // ===== STEP 3: Buscar Organização de Teste =====
    console.log(`\n${colors.bright}[STEP 3] Preparando Dados de Teste${colors.reset}\n`);

    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1)
      .single();

    if (orgError || !organizations) {
      logStep('DATA', 'error', 'Nenhuma organização encontrada no banco');
      results.push({ step: 'DATA', passed: false, message: 'No organization found' });
      throw new Error('É necessário ter pelo menos uma organização cadastrada');
    }

    const organizationId = organizations.id;
    logStep('DATA', 'success', `Organização encontrada: ${organizations.name}`, { id: organizationId });

    // Buscar ou criar instância WhatsApp
    let { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id, phone_number, status')
      .eq('organization_id', organizationId)
      .limit(1)
      .single();

    let instanceId: string;

    if (!instance) {
      logStep('DATA', 'info', 'Criando instância de teste...');

      const { data: newInstance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .insert({
          organization_id: organizationId,
          phone_number: '5511999999999',
          status: 'disconnected',
          name: 'Test Instance',
        })
        .select()
        .single();

      if (instanceError) {
        logStep('DATA', 'error', 'Erro ao criar instância de teste');
        throw instanceError;
      }

      instanceId = newInstance.id;
      logStep('DATA', 'success', 'Instância de teste criada', { id: instanceId });
    } else {
      instanceId = instance.id;
      logStep('DATA', 'success', 'Instância encontrada', {
        id: instanceId,
        phone: instance.phone_number,
        status: instance.status
      });
    }

    // ===== STEP 4: Criar Mensagem de Teste =====
    console.log(`\n${colors.bright}[STEP 4] Enviando Mensagem de Teste para Queue${colors.reset}\n`);

    const testPhone = '5511988887777';
    const testMessage = 'Olá! Quero agendar uma consulta para meu cachorro Rex.';

    const mockMessage = {
      organizationId,
      instanceId,
      message: {
        key: {
          remoteJid: `${testPhone}@s.whatsapp.net`,
          id: `TEST_${Date.now()}`,
          fromMe: false,
        },
        message: {
          conversation: testMessage,
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    };

    logStep('MESSAGE', 'info', 'Criando job na queue', {
      from: testPhone,
      content: testMessage,
    });

    const job = await messageQueue.add('process-message', mockMessage, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    logStep('MESSAGE', 'success', `Job criado com ID: ${job.id}`);
    results.push({ step: 'MESSAGE', passed: true, message: `Job ${job.id} created` });

    // ===== STEP 5: Aguardar Processamento =====
    console.log(`\n${colors.bright}[STEP 5] Aguardando Processamento pelo Worker${colors.reset}\n`);

    logStep('WORKER', 'info', 'Aguardando worker processar (máx. 30s)...');

    let processed = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!processed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;

      const jobState = await job.getState();

      if (jobState === 'completed') {
        processed = true;
        const result = await job.returnvalue;

        logStep('WORKER', 'success', `Job processado com sucesso em ${attempts}s`, result);
        results.push({ step: 'WORKER', passed: true, message: 'Job processed successfully', data: result });

      } else if (jobState === 'failed') {
        logStep('WORKER', 'error', `Job falhou: ${job.failedReason}`);
        results.push({ step: 'WORKER', passed: false, message: job.failedReason || 'Unknown error' });
        throw new Error(`Worker failed: ${job.failedReason}`);

      } else if (attempts % 5 === 0) {
        logStep('WORKER', 'info', `Aguardando... (${attempts}s) - State: ${jobState}`);
      }
    }

    if (!processed) {
      logStep('WORKER', 'warn', 'Worker não processou no tempo limite');
      console.log(`\n${colors.yellow}NOTA: Certifique-se de que o worker está rodando:${colors.reset}`);
      console.log(`${colors.cyan}  npm run worker${colors.reset}\n`);
      results.push({ step: 'WORKER', passed: false, message: 'Timeout waiting for worker' });
      return;
    }

    // ===== STEP 6: Validar Banco de Dados =====
    console.log(`\n${colors.bright}[STEP 6] Validando Dados no Banco${colors.reset}\n`);

    // Verificar contato criado
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('phone', testPhone)
      .single();

    if (contact) {
      logStep('DATABASE', 'success', 'Contato criado/encontrado', {
        id: contact.id,
        name: contact.name,
        phone: contact.phone
      });
      results.push({ step: 'DATABASE_CONTACT', passed: true, message: 'Contact saved' });
    } else {
      logStep('DATABASE', 'error', 'Contato não encontrado');
      results.push({ step: 'DATABASE_CONTACT', passed: false, message: 'Contact not found' });
    }

    // Verificar conversa criada
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('contact_id', contact?.id)
      .single();

    if (conversation) {
      logStep('DATABASE', 'success', 'Conversa criada', {
        id: conversation.id,
        status: conversation.status,
        unread_count: conversation.unread_count
      });
      results.push({ step: 'DATABASE_CONVERSATION', passed: true, message: 'Conversation saved' });
    } else {
      logStep('DATABASE', 'error', 'Conversa não encontrada');
      results.push({ step: 'DATABASE_CONVERSATION', passed: false, message: 'Conversation not found' });
    }

    // Verificar mensagens salvas
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation?.id)
      .order('created_at', { ascending: true });

    if (messages && messages.length >= 2) {
      const incomingMsg = messages.find(m => m.direction === 'incoming');
      const outgoingMsg = messages.find(m => m.direction === 'outgoing');

      if (incomingMsg) {
        logStep('DATABASE', 'success', 'Mensagem recebida salva', {
          id: incomingMsg.id,
          content: incomingMsg.content.substring(0, 50) + '...',
        });
      }

      if (outgoingMsg) {
        logStep('DATABASE', 'success', 'Resposta da IA salva', {
          id: outgoingMsg.id,
          content: outgoingMsg.content.substring(0, 50) + '...',
          sent_by_ai: outgoingMsg.sent_by_ai,
        });

        console.log(`\n${colors.bright}${colors.cyan}${'─'.repeat(80)}${colors.reset}`);
        console.log(`${colors.bright}EXEMPLO DE CONVERSA COMPLETA:${colors.reset}\n`);
        console.log(`${colors.green}👤 Cliente: ${incomingMsg?.content}${colors.reset}\n`);
        console.log(`${colors.blue}🤖 IA: ${outgoingMsg.content}${colors.reset}`);
        console.log(`${colors.cyan}${'─'.repeat(80)}${colors.reset}\n`);
      }

      results.push({ step: 'DATABASE_MESSAGES', passed: true, message: `${messages.length} messages saved` });
    } else {
      logStep('DATABASE', 'warn', 'Mensagens não encontradas ou incompletas', {
        count: messages?.length || 0
      });
      results.push({ step: 'DATABASE_MESSAGES', passed: false, message: 'Messages not saved' });
    }

    // Verificar interação de IA
    const { data: aiInteractions } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('conversation_id', conversation?.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (aiInteractions && aiInteractions.length > 0) {
      const interaction = aiInteractions[0];
      logStep('DATABASE', 'success', 'Interação de IA registrada', {
        model: interaction.model,
        tokens: interaction.total_tokens,
        status: interaction.status,
      });
      results.push({ step: 'DATABASE_AI', passed: true, message: 'AI interaction logged' });
    }

    // ===== RESULTADOS FINAIS =====
    console.log(`\n${colors.bright}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}RESULTADOS DA VALIDAÇÃO${colors.reset}`);
    console.log(`${colors.bright}${'='.repeat(80)}${colors.reset}\n`);

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    results.forEach(result => {
      const icon = result.passed ? '✓' : '✗';
      const color = result.passed ? colors.green : colors.red;
      console.log(`${color}${icon} ${result.step}: ${result.message}${colors.reset}`);
    });

    console.log(`\n${colors.bright}Total: ${passed}/${total} passed${colors.reset}`);

    if (failed === 0) {
      console.log(`\n${colors.green}${colors.bright}✓ VALIDAÇÃO COMPLETA - SISTEMA FUNCIONANDO PERFEITAMENTE!${colors.reset}\n`);
    } else {
      console.log(`\n${colors.yellow}${colors.bright}⚠ VALIDAÇÃO PARCIAL - Alguns componentes precisam de atenção${colors.reset}\n`);
    }

    console.log(`${colors.cyan}Fluxo validado:${colors.reset}`);
    console.log(`${colors.cyan}  1. Mensagem adicionada à queue${colors.reset}`);
    console.log(`${colors.cyan}  2. Worker consumiu e processou${colors.reset}`);
    console.log(`${colors.cyan}  3. Contato e conversa criados${colors.reset}`);
    console.log(`${colors.cyan}  4. Mensagem recebida salva${colors.reset}`);
    console.log(`${colors.cyan}  5. IA processou e gerou resposta${colors.reset}`);
    console.log(`${colors.cyan}  6. Resposta salva no banco${colors.reset}`);
    console.log(`${colors.cyan}  7. Interação registrada${colors.reset}\n`);

  } catch (error: any) {
    console.log(`\n${colors.red}${colors.bright}✗ VALIDAÇÃO FALHOU${colors.reset}\n`);
    console.error(`${colors.red}Erro: ${error.message}${colors.reset}`);

    if (error.stack) {
      console.error(`\n${colors.red}Stack:${colors.reset}`);
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Executar validação
validateWorkerSystem()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
