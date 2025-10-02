#!/usr/bin/env ts-node
/**
 * Message Simulator
 *
 * Simula mensagem recebida para testar processamento sem WhatsApp real
 *
 * Uso:
 * npm run whatsapp:simulate <orgId> <instanceId> <fromPhone> "message"
 *
 * Exemplo:
 * npm run whatsapp:simulate org-123 inst-456 5511999999999 "Olá, quero saber sobre produtos"
 */

import { messageQueue } from '../src/config/redis';
import { supabase } from '../src/config/supabase';

async function simulateMessage() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 4) {
      console.error(`
❌ Argumentos insuficientes!

Uso: npm run whatsapp:simulate <orgId> <instanceId> <fromPhone> "message"

Argumentos:
  - orgId:       ID da organização
  - instanceId:  ID da instância WhatsApp
  - fromPhone:   Número de quem está enviando (com código do país)
  - message:     Conteúdo da mensagem (entre aspas)

Exemplo:
  npm run whatsapp:simulate org-123 inst-456 5511999999999 "Olá!"
      `);
      process.exit(1);
    }

    const [orgId, instanceId, fromPhone, message] = args;

    console.log(`
🎭 Simulando Mensagem Recebida
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Organização: ${orgId}
  Instância:   ${instanceId}
  De:          ${fromPhone}
  Mensagem:    ${message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Verificar se instância existe
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('id, name')
      .eq('organization_id', orgId)
      .eq('id', instanceId)
      .single();

    if (error || !instance) {
      throw new Error(`Instância não encontrada: ${error?.message || 'Unknown'}`);
    }

    console.log(`✅ Instância encontrada: ${instance.name || 'Sem nome'}`);

    // Criar mensagem simulada no formato Baileys
    const mockMessage = {
      key: {
        remoteJid: `${fromPhone}@s.whatsapp.net`,
        id: `MOCK-${Date.now()}`,
        fromMe: false,
        participant: undefined
      },
      message: {
        conversation: message,
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Usuário Simulado',
    };

    console.log(`\n📦 Adicionando mensagem na fila de processamento...`);

    // Adicionar na fila
    const job = await messageQueue.add('process-message', {
      organizationId: orgId,
      instanceId: instanceId,
      message: mockMessage,
    });

    console.log(`
✅ Mensagem simulada com sucesso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Job ID:      ${job.id}
  Queue:       process-message
  Timestamp:   ${new Date().toISOString()}

  💡 A mensagem será processada pelo worker em alguns segundos.
     Verifique os logs do worker para acompanhar o processamento.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

  } catch (error: any) {
    console.error(`
❌ Erro ao simular mensagem!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Erro: ${error.message}
  Stack: ${error.stack}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    process.exit(1);
  }
}

simulateMessage();
