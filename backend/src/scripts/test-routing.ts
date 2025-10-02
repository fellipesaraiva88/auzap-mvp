import { supabase } from '../config/supabase';
import { detectOwnerNumber } from '../middleware/aurora-auth.middleware';
import { logger } from '../config/logger';

/**
 * Script para testar o roteamento de mensagens
 * Valida detecção de dono vs cliente
 */

interface TestCase {
  phoneNumber: string;
  expectedType: 'owner' | 'client';
  description: string;
}

async function testRouting() {
  console.log('\n=== TESTE DE ROTEAMENTO DE MENSAGENS ===\n');

  // Buscar organizações para teste
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.error('❌ Nenhuma organização encontrada!');
    return;
  }

  const orgId = orgs[0].id;
  const orgName = orgs[0].name;

  console.log(`📊 Organização: ${orgName} (${orgId})\n`);

  // Buscar números autorizados (donos)
  const { data: ownerNumbers } = await supabase
    .from('authorized_owner_numbers')
    .select('phone_number, users(name)')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  if (!ownerNumbers || ownerNumbers.length === 0) {
    console.log('⚠️  Nenhum número de dono cadastrado. Vamos criar um para teste.\n');

    // Buscar usuário da org
    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('organization_id', orgId)
      .single();

    if (!user) {
      console.error('❌ Nenhum usuário encontrado!');
      return;
    }

    // Criar número de dono de teste
    const testOwnerPhone = '5511999999999';
    await supabase.from('authorized_owner_numbers').insert({
      organization_id: orgId,
      user_id: user.id,
      phone_number: testOwnerPhone,
      is_active: true,
      permissions: ['read', 'write', 'admin'],
    });

    console.log(`✅ Número de dono criado: ${testOwnerPhone} (${user.name})\n`);
  }

  // Recarregar números de dono
  const { data: reloadedOwners } = await supabase
    .from('authorized_owner_numbers')
    .select('phone_number, users(name)')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const ownerPhone = reloadedOwners?.[0]?.phone_number || '';
  const ownerName = (reloadedOwners?.[0]?.users as any)?.name || 'Dono';

  // Casos de teste
  const testCases: TestCase[] = [
    {
      phoneNumber: ownerPhone,
      expectedType: 'owner',
      description: `Número do dono (${ownerName})`,
    },
    {
      phoneNumber: '5511888888888',
      expectedType: 'client',
      description: 'Número de cliente (não cadastrado)',
    },
    {
      phoneNumber: '5521777777777',
      expectedType: 'client',
      description: 'Outro número de cliente',
    },
  ];

  console.log('🔍 EXECUTANDO TESTES...\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`📞 Testando: ${testCase.description}`);
    console.log(`   Número: ${testCase.phoneNumber}`);

    const context = await detectOwnerNumber(testCase.phoneNumber, orgId);

    const actualType = context.isOwner ? 'owner' : 'client';
    const agentType = context.isOwner ? '[AURORA]' : '[CLIENT-AI]';
    const match = actualType === testCase.expectedType;

    if (match) {
      console.log(`   ✅ PASSOU - Roteado para ${agentType}`);
      passed++;
    } else {
      console.log(`   ❌ FALHOU - Esperado: ${testCase.expectedType}, Recebido: ${actualType}`);
      failed++;
    }

    console.log('');
  }

  // Resumo
  console.log('=== RESUMO DOS TESTES ===\n');
  console.log(`✅ Passaram: ${passed}/${testCases.length}`);
  console.log(`❌ Falharam: ${failed}/${testCases.length}`);

  if (failed === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!\n');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM!\n');
  }

  // Testar logs estruturados
  console.log('=== EXEMPLO DE LOGS ESTRUTURADOS ===\n');

  logger.info({
    from: ownerPhone,
    type: 'OWNER',
    agentType: 'aurora',
    messageContent: 'Como está o faturamento hoje?'
  }, '[AURORA] Processing owner message');

  logger.info({
    from: '5511888888888',
    type: 'CLIENT',
    agentType: 'client-ai',
    messageContent: 'Quero agendar banho para meu cachorro'
  }, '[CLIENT-AI] Processing client message');

  console.log('\n✅ Logs estruturados gerados!\n');
}

// Executar
testRouting()
  .then(() => {
    console.log('✅ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no script:', error);
    process.exit(1);
  });
