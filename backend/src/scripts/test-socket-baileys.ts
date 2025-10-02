/**
 * Script de Teste: Socket.IO + Baileys Integration
 * Valida emissão de eventos de QR Code e Pairing Code
 */

import { io as ioClient } from 'socket.io-client';
import { supabase } from '../config/supabase';
import { logger } from '../config/logger';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TEST_ORG_ID = process.env.TEST_ORG_ID;
const TEST_PHONE = process.env.TEST_PHONE; // Formato: 5511999999999

interface TestResult {
  step: string;
  status: 'success' | 'failed' | 'pending';
  message: string;
  timestamp: string;
}

const results: TestResult[] = [];

function addResult(step: string, status: TestResult['status'], message: string) {
  results.push({
    step,
    status,
    message,
    timestamp: new Date().toISOString(),
  });

  const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏳';
  logger.info(`${emoji} [${step}] ${message}`);
}

async function testSocketConnection() {
  addResult('Socket Connection', 'pending', 'Iniciando teste de conexão Socket.IO...');

  return new Promise((resolve, reject) => {
    const socket = ioClient(BACKEND_URL, {
      transports: ['websocket'],
      timeout: 10000,
    });

    socket.on('connect', () => {
      addResult('Socket Connection', 'success', `Conectado ao servidor Socket.IO (ID: ${socket.id})`);
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      addResult('Socket Connection', 'failed', `Erro ao conectar: ${error.message}`);
      reject(error);
    });

    setTimeout(() => {
      if (!socket.connected) {
        addResult('Socket Connection', 'failed', 'Timeout ao conectar');
        reject(new Error('Connection timeout'));
      }
    }, 10000);
  });
}

async function testOrganizationRoom(socket: any, orgId: string) {
  addResult('Organization Room', 'pending', `Entrando na sala org-${orgId}...`);

  socket.emit('join-organization', orgId);

  await new Promise(resolve => setTimeout(resolve, 1000));

  addResult('Organization Room', 'success', `Entrou na sala org-${orgId}`);
}

async function testWhatsAppInstanceCreation(orgId: string) {
  addResult('Instance Creation', 'pending', 'Criando instância WhatsApp...');

  const response = await fetch(`${BACKEND_URL}/api/whatsapp/instances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: orgId,
      instance_name: 'Test Instance',
      phone_number: TEST_PHONE,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();

  if (!data.success || !data.instance) {
    throw new Error('Resposta inesperada ao criar instância');
  }

  addResult('Instance Creation', 'success', `Instância criada: ${data.instance.id}`);
  return data.instance.id;
}

async function testPairingCodeGeneration(socket: any, instanceId: string) {
  addResult('Pairing Code', 'pending', 'Solicitando código de pareamento...');

  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      addResult('Pairing Code', 'failed', 'Timeout aguardando pairing code');
      reject(new Error('Pairing code timeout'));
    }, 30000);

    // Listener para pairing code
    socket.on('whatsapp:pairing-code', (data: any) => {
      clearTimeout(timeout);

      if (data.instanceId === instanceId) {
        addResult('Pairing Code', 'success', `Código recebido: ${data.code}`);
        resolve(data.code);
      }
    });

    // Conectar instância
    const response = await fetch(`${BACKEND_URL}/api/whatsapp/instances/${instanceId}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: TEST_PHONE,
        method: 'code',
      }),
    });

    const result = await response.json();

    if (result.pairingCode) {
      clearTimeout(timeout);
      addResult('Pairing Code', 'success', `Código retornado na API: ${result.pairingCode}`);
      resolve(result.pairingCode);
    }
  });
}

async function testQRCodeGeneration(socket: any, instanceId: string) {
  addResult('QR Code', 'pending', 'Solicitando QR Code...');

  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      addResult('QR Code', 'failed', 'Timeout aguardando QR code');
      reject(new Error('QR code timeout'));
    }, 30000);

    // Listener para QR code
    socket.on('whatsapp:qr', (data: any) => {
      clearTimeout(timeout);

      if (data.instanceId === instanceId) {
        const qrLength = data.qr?.length || 0;
        addResult('QR Code', 'success', `QR Code recebido via Socket.IO (${qrLength} chars)`);
        resolve(data.qr);
      }
    });

    // Conectar instância com método QR
    await fetch(`${BACKEND_URL}/api/whatsapp/instances/${instanceId}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'qr',
      }),
    });
  });
}

async function testConnectionEvents(socket: any, instanceId: string) {
  addResult('Connection Events', 'pending', 'Aguardando eventos de conexão...');

  return new Promise((resolve) => {
    const events: string[] = [];

    socket.on('whatsapp:connected', (data: any) => {
      if (data.instanceId === instanceId) {
        events.push('connected');
        addResult('Connection Events', 'success', 'Evento whatsapp:connected recebido');
      }
    });

    socket.on('whatsapp:disconnected', (data: any) => {
      if (data.instanceId === instanceId) {
        events.push('disconnected');
        addResult('Connection Events', 'success', 'Evento whatsapp:disconnected recebido');
      }
    });

    // Aguardar 10s para eventos
    setTimeout(() => {
      if (events.length === 0) {
        addResult('Connection Events', 'pending', 'Nenhum evento de conexão recebido (normal se não conectou)');
      }
      resolve(events);
    }, 10000);
  });
}

async function runTests() {
  logger.info('==================================================');
  logger.info('TESTE: Socket.IO + Baileys Integration');
  logger.info('==================================================\n');

  if (!TEST_ORG_ID) {
    logger.error('❌ TEST_ORG_ID não configurado no .env');
    process.exit(1);
  }

  if (!TEST_PHONE) {
    logger.error('❌ TEST_PHONE não configurado no .env');
    process.exit(1);
  }

  let socket: any;
  let instanceId: string;

  try {
    // 1. Conectar Socket.IO
    socket = await testSocketConnection();

    // 2. Entrar na sala da organização
    await testOrganizationRoom(socket, TEST_ORG_ID);

    // 3. Criar instância WhatsApp
    instanceId = await testWhatsAppInstanceCreation(TEST_ORG_ID);

    // 4. Testar Pairing Code
    try {
      await testPairingCodeGeneration(socket, instanceId);
    } catch (error: any) {
      addResult('Pairing Code', 'failed', error.message);
    }

    // 5. Aguardar eventos de conexão
    await testConnectionEvents(socket, instanceId);

    // Relatório Final
    logger.info('\n==================================================');
    logger.info('RELATÓRIO FINAL');
    logger.info('==================================================\n');

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const pendingCount = results.filter(r => r.status === 'pending').length;

    results.forEach(r => {
      const emoji = r.status === 'success' ? '✅' : r.status === 'failed' ? '❌' : '⏳';
      logger.info(`${emoji} ${r.step}: ${r.message}`);
    });

    logger.info(`\nTotal: ${results.length} | Sucesso: ${successCount} | Falhas: ${failedCount} | Pendentes: ${pendingCount}`);

    // Cleanup
    if (instanceId) {
      logger.info('\nLimpando instância de teste...');
      await fetch(`${BACKEND_URL}/api/whatsapp/instances/${instanceId}`, {
        method: 'DELETE',
      });
    }

  } catch (error: any) {
    logger.error({ error }, 'Erro durante testes');
  } finally {
    if (socket) {
      socket.disconnect();
    }
    process.exit(0);
  }
}

// Executar testes
runTests();
