/**
 * Script de teste para recepção de mensagens WhatsApp
 *
 * Como usar:
 * 1. Certifique-se de ter uma instância conectada
 * 2. Execute: npx ts-node src/scripts/test-message-reception.ts
 * 3. Envie uma mensagem para o número conectado
 * 4. Verifique os logs e o banco de dados
 */

import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

async function testMessageReception() {
  try {
    console.log('\n=== TESTE DE RECEPÇÃO DE MENSAGENS ===\n');

    // 1. Buscar instâncias conectadas
    const { data: instances, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('status', 'connected')
      .limit(5);

    if (instanceError) throw instanceError;

    console.log(`✓ Encontradas ${instances?.length || 0} instâncias conectadas`);

    if (!instances || instances.length === 0) {
      console.log('\n⚠️  Nenhuma instância conectada encontrada!');
      console.log('   Por favor, conecte uma instância primeiro usando /api/whatsapp/initialize\n');
      return;
    }

    instances.forEach((instance, index) => {
      console.log(`   ${index + 1}. ${instance.name} (${instance.phone_number || 'N/A'})`);
    });

    // 2. Buscar mensagens recentes (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: recentMessages, error: messagesError, count } = await supabase
      .from('messages')
      .select('*, conversation:conversations(*, contact:contacts(*))', { count: 'exact' })
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError) throw messagesError;

    console.log(`\n✓ Encontradas ${count || 0} mensagens nos últimos 5 minutos`);

    if (recentMessages && recentMessages.length > 0) {
      console.log('\nMensagens recentes:');
      recentMessages.forEach((msg: any, index) => {
        console.log(`\n   ${index + 1}. [${msg.direction.toUpperCase()}] ${msg.created_at}`);
        console.log(`      Conversa: ${msg.conversation?.id}`);
        console.log(`      Contato: ${msg.conversation?.contact?.name || msg.conversation?.contact?.phone}`);
        console.log(`      Tipo: ${msg.message_type}`);
        console.log(`      Conteúdo: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
        console.log(`      From me: ${msg.from_me}`);
        console.log(`      Sent by AI: ${msg.sent_by_ai || false}`);
      });
    }

    // 3. Buscar conversas ativas
    const { data: activeConversations, error: convError } = await supabase
      .from('conversations')
      .select('*, contact:contacts(*)')
      .eq('status', 'active')
      .order('last_message_at', { ascending: false })
      .limit(5);

    if (convError) throw convError;

    console.log(`\n✓ Encontradas ${activeConversations?.length || 0} conversas ativas`);

    if (activeConversations && activeConversations.length > 0) {
      console.log('\nConversas ativas:');
      activeConversations.forEach((conv: any, index) => {
        console.log(`\n   ${index + 1}. ID: ${conv.id}`);
        console.log(`      Contato: ${conv.contact?.name || conv.contact?.phone}`);
        console.log(`      Última mensagem: ${conv.last_message_at}`);
        console.log(`      Preview: ${conv.last_message_preview || 'N/A'}`);
        console.log(`      Mensagens não lidas: ${conv.unread_count || 0}`);
      });
    }

    // 4. Estatísticas gerais
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    console.log('\n=== ESTATÍSTICAS GERAIS ===');
    console.log(`   Total de mensagens: ${totalMessages || 0}`);
    console.log(`   Total de conversas: ${totalConversations || 0}`);
    console.log(`   Total de contatos: ${totalContacts || 0}`);

    console.log('\n=== INSTRUÇÕES PARA TESTAR ===');
    console.log('1. Envie uma mensagem para um dos números conectados acima');
    console.log('2. Aguarde alguns segundos');
    console.log('3. Execute este script novamente para ver a mensagem salva');
    console.log('4. Verifique também o Supabase Dashboard\n');

  } catch (error) {
    console.error('\n❌ Erro:', error);
  }
}

// Executar teste
testMessageReception()
  .then(() => {
    console.log('\n✓ Teste concluído\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
