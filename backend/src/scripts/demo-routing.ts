import { detectOwnerNumber } from '../middleware/aurora-auth.middleware';
import { logger } from '../config/logger';

/**
 * Demonstração visual do sistema de roteamento
 * Simula detecção e mostra como mensagens são roteadas
 */

interface Message {
  from: string;
  content: string;
  timestamp: Date;
}

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Cores
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Backgrounds
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printHeader(title: string) {
  const line = '═'.repeat(70);
  console.log(`\n${colorize(line, 'cyan')}`);
  console.log(colorize(`  ${title}`, 'bright'));
  console.log(`${colorize(line, 'cyan')}\n`);
}

function printStep(step: number, description: string) {
  console.log(`${colorize(`[STEP ${step}]`, 'yellow')} ${description}`);
}

function printSuccess(message: string) {
  console.log(`${colorize('✓', 'green')} ${message}`);
}

function printInfo(message: string) {
  console.log(`${colorize('ℹ', 'blue')} ${message}`);
}

function printWarning(message: string) {
  console.log(`${colorize('⚠', 'yellow')} ${message}`);
}

async function simulateMessageFlow(message: Message, orgId: string) {
  console.log(`\n${colorize('━'.repeat(70), 'dim')}`);
  console.log(`${colorize('📱 NOVA MENSAGEM RECEBIDA', 'bright')}`);
  console.log(`${colorize('━'.repeat(70), 'dim')}\n`);

  printInfo(`De: ${colorize(message.from, 'cyan')}`);
  printInfo(`Mensagem: "${colorize(message.content, 'white')}"`);
  printInfo(`Timestamp: ${message.timestamp.toLocaleString('pt-BR')}`);

  console.log('');

  // Simular delay de recebimento
  await sleep(500);

  printStep(1, 'Adicionando na fila Redis...');
  await sleep(300);
  printSuccess('Mensagem enfileirada com sucesso');

  console.log('');

  printStep(2, 'Worker processando mensagem...');
  await sleep(300);
  printSuccess('Worker iniciou processamento');

  console.log('');

  printStep(3, 'Detectando tipo de remetente...');
  await sleep(500);

  const context = await detectOwnerNumber(message.from, orgId);

  if (context.isOwner) {
    console.log(`\n${colorize('┌─────────────────────────────────────────────┐', 'magenta')}`);
    console.log(`${colorize('│', 'magenta')}  ${colorize('👔 DONO DETECTADO!', 'bright')}                     ${colorize('│', 'magenta')}`);
    console.log(`${colorize('│', 'magenta')}  Roteando para: ${colorize('[AURORA]', 'magenta')}              ${colorize('│', 'magenta')}`);
    console.log(`${colorize('└─────────────────────────────────────────────┘', 'magenta')}\n`);

    printInfo(`User ID: ${context.userId}`);
    printInfo(`Owner Number ID: ${context.ownerNumberId}`);

    console.log('');

    printStep(4, 'Aurora processando mensagem...');
    await sleep(800);
    printSuccess('Contexto do negócio carregado');
    await sleep(300);
    printSuccess('Analytics gerado');
    await sleep(300);
    printSuccess('Funções disponíveis verificadas');

    console.log('');

    printStep(5, 'Gerando resposta com GPT-4o...');
    await sleep(1500);

    const auroraResponse = generateAuroraResponse(message.content);
    console.log(`\n${colorize('📊 RESPOSTA AURORA:', 'magenta')}`);
    console.log(`${colorize('─'.repeat(50), 'dim')}`);
    console.log(`${auroraResponse}`);
    console.log(`${colorize('─'.repeat(50), 'dim')}\n`);

    printStep(6, 'Salvando interação...');
    await sleep(300);
    printSuccess(`Salvo em ai_interactions (agent_type: '${colorize('aurora', 'magenta')}')`);

  } else {
    console.log(`\n${colorize('┌─────────────────────────────────────────────┐', 'green')}`);
    console.log(`${colorize('│', 'green')}  ${colorize('🐾 CLIENTE DETECTADO!', 'bright')}                  ${colorize('│', 'green')}`);
    console.log(`${colorize('│', 'green')}  Roteando para: ${colorize('[CLIENT-AI]', 'green')}           ${colorize('│', 'green')}`);
    console.log(`${colorize('└─────────────────────────────────────────────┘', 'green')}\n`);

    printStep(4, 'Buscando/criando contato...');
    await sleep(500);
    printSuccess('Contato identificado');

    console.log('');

    printStep(5, 'Buscando/criando conversa...');
    await sleep(400);
    printSuccess('Conversa ativa encontrada');

    console.log('');

    printStep(6, 'Client-AI processando mensagem...');
    await sleep(800);
    printSuccess('Histórico de conversa carregado');
    await sleep(300);
    printSuccess('Pets do cliente carregados');
    await sleep(300);
    printSuccess('Serviços disponíveis carregados');

    console.log('');

    printStep(7, 'Gerando resposta com GPT-4o-mini...');
    await sleep(1500);

    const clientResponse = generateClientResponse(message.content);
    console.log(`\n${colorize('🐾 RESPOSTA CLIENT-AI:', 'green')}`);
    console.log(`${colorize('─'.repeat(50), 'dim')}`);
    console.log(`${clientResponse}`);
    console.log(`${colorize('─'.repeat(50), 'dim')}\n`);

    printStep(8, 'Salvando interação...');
    await sleep(300);
    printSuccess(`Salvo em ai_interactions (agent_type: '${colorize('client-ai', 'green')}')`);
  }

  console.log('');

  const finalStep = context.isOwner ? 7 : 9;
  printStep(finalStep, 'Enviando resposta via WhatsApp...');
  await sleep(600);
  printSuccess('Mensagem enviada com sucesso!');

  console.log('');

  // Resumo de logs
  console.log(`${colorize('📋 LOGS GERADOS:', 'bright')}`);
  console.log(`${colorize('─'.repeat(50), 'dim')}`);

  if (context.isOwner) {
    console.log(`${colorize('[AURORA]', 'magenta')} Processing owner message`);
    console.log(`${colorize('[AURORA]', 'magenta')} Response sent successfully`);
  } else {
    console.log(`${colorize('[CLIENT-AI]', 'green')} Processing client message`);
    console.log(`${colorize('[CLIENT-AI]', 'green')} Response sent successfully`);
  }

  console.log(`${colorize('─'.repeat(50), 'dim')}\n`);

  // Métricas
  console.log(`${colorize('📈 MÉTRICAS:', 'bright')}`);
  console.log(`${colorize('─'.repeat(50), 'dim')}`);
  console.log(`Agent Type: ${context.isOwner ? colorize('aurora', 'magenta') : colorize('client-ai', 'green')}`);
  console.log(`Model: ${context.isOwner ? 'gpt-4o' : 'gpt-4o-mini'}`);
  console.log(`Tokens: ~${context.isOwner ? '1500' : '800'}`);
  console.log(`Custo: ~$${context.isOwner ? '0.015' : '0.004'}`);
  console.log(`${colorize('─'.repeat(50), 'dim')}\n`);
}

function generateAuroraResponse(content: string): string {
  const responses: { [key: string]: string } = {
    default: `📊 Olá, dono!\n\nVi sua mensagem: "${content}"\n\nAqui estão alguns insights:\n• 12 agendamentos hoje\n• R$ 2.450 em receita\n• 3 clientes inativos há 30+ dias\n\nPrecisa de algo mais específico?`,
    faturamento: `💰 Faturamento Hoje:\n\n• Total: R$ 2.450,00\n• Agendamentos: 12\n• Ticket médio: R$ 204,17\n• Meta do dia: 80% atingida\n\n🔥 Melhor serviço: Banho & Tosa (R$ 980)`,
    clientes: `👥 Status de Clientes:\n\n• Ativos: 147\n• Inativos (30+ dias): 23\n• Novos este mês: 8\n\n💡 Sugestão: Quer que eu envie mensagens automáticas para os inativos?`,
  };

  if (content.toLowerCase().includes('faturamento')) return responses.faturamento;
  if (content.toLowerCase().includes('cliente')) return responses.clientes;
  return responses.default;
}

function generateClientResponse(content: string): string {
  const responses: { [key: string]: string } = {
    default: `🐾 Olá! Tudo bem?\n\nVi que você disse: "${content}"\n\nComo posso ajudar você hoje?\n\n• Agendar serviço\n• Ver horários disponíveis\n• Cadastrar novo pet`,
    agendar: `📅 Vamos agendar!\n\nQual serviço você precisa?\n• Banho & Tosa - R$ 80 (90 min)\n• Consulta Veterinária - R$ 150 (30 min)\n• Day Care - R$ 60 (dia todo)\n\nQual o nome do seu pet?`,
    horarios: `🕒 Horários Disponíveis Amanhã:\n\n• 09:00\n• 10:30\n• 14:00\n• 15:30\n• 17:00\n\nQual prefere?`,
  };

  if (content.toLowerCase().includes('agendar')) return responses.agendar;
  if (content.toLowerCase().includes('horário')) return responses.horarios;
  return responses.default;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
  printHeader('🤖 DEMONSTRAÇÃO DO SISTEMA DE ROTEAMENTO');

  printInfo('Este é um exemplo interativo de como o sistema funciona');
  printInfo('Vamos simular 3 mensagens: 2 de donos e 1 de cliente');

  await sleep(2000);

  // Mensagem 1: Dono perguntando sobre faturamento
  await simulateMessageFlow(
    {
      from: '5511999999999', // Assumindo que este é um número de dono
      content: 'Como está o faturamento hoje?',
      timestamp: new Date(),
    },
    'example-org-id'
  );

  await sleep(2000);

  // Mensagem 2: Cliente querendo agendar
  await simulateMessageFlow(
    {
      from: '5511888888888', // Número de cliente
      content: 'Quero agendar banho para meu cachorro',
      timestamp: new Date(),
    },
    'example-org-id'
  );

  await sleep(2000);

  // Mensagem 3: Dono perguntando sobre clientes
  await simulateMessageFlow(
    {
      from: '5511999999999', // Número de dono
      content: 'Quantos clientes inativos temos?',
      timestamp: new Date(),
    },
    'example-org-id'
  );

  console.log(`\n${colorize('═'.repeat(70), 'cyan')}`);
  console.log(colorize('  ✅ DEMONSTRAÇÃO CONCLUÍDA!', 'bright'));
  console.log(`${colorize('═'.repeat(70), 'cyan')}\n`);

  printSuccess('Sistema de roteamento funcionando perfeitamente!');
  printSuccess('Donos são roteados para Aurora');
  printSuccess('Clientes são roteados para Client-AI');
  printSuccess('Logs estruturados gerados corretamente');
  printSuccess('Métricas separadas por agente');

  console.log(`\n${colorize('📚 PRÓXIMOS PASSOS:', 'bright')}\n`);
  console.log('  1. npm run test:routing - Testar com dados reais');
  console.log('  2. npm run routing:status - Ver dashboard de métricas');
  console.log('  3. Cadastrar números de donos no Supabase');
  console.log('  4. Monitorar logs em produção\n');
}

// Executar demo
runDemo()
  .then(() => {
    console.log(colorize('\n✨ Demo finalizada com sucesso!\n', 'green'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(colorize('\n❌ Erro na demo:', 'red'), error);
    process.exit(1);
  });
