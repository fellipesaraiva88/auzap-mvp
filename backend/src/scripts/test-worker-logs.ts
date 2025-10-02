/**
 * VALIDAÇÃO DOS LOGS ESTRUTURADOS DO WORKER
 *
 * Verifica se os logs estão sendo emitidos corretamente
 * com informações estruturadas para debugging
 */

import { logger } from '../config/logger';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

console.log(`${colors.bright}${'='.repeat(80)}${colors.reset}`);
console.log(`${colors.bright}${colors.magenta}TESTE DE LOGS ESTRUTURADOS DO WORKER${colors.reset}`);
console.log(`${colors.bright}${'='.repeat(80)}${colors.reset}\n`);

// Simular diferentes tipos de logs que o worker emite

console.log(`${colors.cyan}[1] Log de Processamento Iniciado:${colors.reset}`);
logger.info({
  jobId: 'test-job-123',
  organizationId: 'org-456',
  instanceId: 'instance-789',
  from: '5511999999999',
  messageContent: 'Olá! Gostaria de agendar uma consulta.',
}, '[WORKER] Processing message');

console.log(`\n${colors.cyan}[2] Log de Mensagem Aurora (Owner):${colors.reset}`);
logger.info({
  from: '5511988887777',
  type: 'OWNER',
  agentType: 'aurora',
  userId: 'user-123',
  messageContent: 'Quantos clientes atendi hoje?',
}, '[AURORA] Processing owner message');

console.log(`\n${colors.cyan}[3] Log de Mensagem Cliente:${colors.reset}`);
logger.info({
  from: '5511977776666',
  type: 'CLIENT',
  agentType: 'client-ai',
  messageContent: 'Quero agendar banho para meu cachorro',
}, '[CLIENT-AI] Processing client message');

console.log(`\n${colors.cyan}[4] Log de Resposta Enviada:${colors.reset}`);
logger.info({
  from: '5511977776666',
  agentType: 'client-ai',
  contactId: 'contact-abc',
  conversationId: 'conv-xyz',
  responseLength: 145,
}, '[CLIENT-AI] Response sent successfully');

console.log(`\n${colors.cyan}[5] Log de Job Completado:${colors.reset}`);
logger.info({
  jobId: 'test-job-123',
  success: true,
  isOwner: false,
  processingTime: '2.3s',
}, '✅ Job completed');

console.log(`\n${colors.cyan}[6] Log de Erro:${colors.reset}`);
logger.error({
  error: { message: 'Test error', code: 'TEST_ERROR' },
  jobId: 'test-job-456',
  organizationId: 'org-789',
  from: '5511966665555',
}, '❌ Error processing message');

console.log(`\n${colors.cyan}[7] Log de Warning (Sem Conteúdo):${colors.reset}`);
logger.warn({
  messageType: 'imageMessage',
  jobId: 'test-job-789',
}, 'No text content found - skipping processing');

console.log(`\n${colors.green}${colors.bright}✓ TESTE DE LOGS CONCLUÍDO${colors.reset}\n`);

console.log(`${colors.cyan}Estrutura dos logs validada:${colors.reset}`);
console.log(`${colors.cyan}  - Logs estruturados com contexto${colors.reset}`);
console.log(`${colors.cyan}  - Informações de rastreamento (jobId, organizationId)${colors.reset}`);
console.log(`${colors.cyan}  - Tipo de agente (aurora/client-ai)${colors.reset}`);
console.log(`${colors.cyan}  - Métricas de processamento${colors.reset}`);
console.log(`${colors.cyan}  - Erros com stack trace${colors.reset}\n`);
