#!/usr/bin/env ts-node
/**
 * Test Message Sender
 *
 * Envia mensagem de teste via CLI para validar instância WhatsApp
 *
 * Uso:
 * npm run whatsapp:send <orgId> <instanceId> <phone> "Mensagem"
 *
 * Exemplo:
 * npm run whatsapp:send org-123 inst-456 5511999999999 "Olá, esta é uma mensagem de teste!"
 */

import { BaileysService } from '../src/services/baileys.service';
import { supabase } from '../src/config/supabase';
import { logger } from '../src/config/logger';

async function sendTestMessage() {
  try {
    const args = process.argv.slice(2);

    if (args.length < 4) {
      console.error(`
❌ Argumentos insuficientes!

Uso: npm run whatsapp:send <orgId> <instanceId> <phone> "message"

Argumentos:
  - orgId:      ID da organização
  - instanceId: ID da instância WhatsApp
  - phone:      Número do telefone (com código do país, sem +)
  - message:    Mensagem a ser enviada (entre aspas)

Exemplo:
  npm run whatsapp:send org-123 inst-456 5511999999999 "Olá!"
      `);
      process.exit(1);
    }

    const [orgId, instanceId, phone, message] = args;

    console.log(`
📱 Enviando Mensagem de Teste
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Organização: ${orgId}
  Instância:   ${instanceId}
  Para:        ${phone}
  Mensagem:    ${message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Verificar se instância existe e está conectada
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('id, status, phone_number, name')
      .eq('organization_id', orgId)
      .eq('id', instanceId)
      .single();

    if (error || !instance) {
      throw new Error(`Instância não encontrada: ${error?.message || 'Unknown error'}`);
    }

    if (instance.status !== 'connected') {
      console.warn(`⚠️  Atenção: Instância está com status "${instance.status}", mas tentando enviar mesmo assim...`);
    }

    console.log(`📋 Instância encontrada: ${instance.name || 'Sem nome'}`);
    console.log(`📞 Telefone da instância: ${instance.phone_number || 'Não configurado'}`);
    console.log(`\n🚀 Enviando mensagem...`);

    // Enviar mensagem
    await BaileysService.sendMessage(orgId, instanceId, phone, message);

    console.log(`
✅ Mensagem enviada com sucesso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Timestamp: ${new Date().toISOString()}
  Status:    Enviada
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

  } catch (error: any) {
    console.error(`
❌ Erro ao enviar mensagem!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Erro: ${error.message}
  Stack: ${error.stack}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    process.exit(1);
  }
}

sendTestMessage();
