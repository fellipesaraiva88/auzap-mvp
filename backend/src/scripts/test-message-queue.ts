/**
 * Teste de integração do fluxo de mensagens
 *
 * Simula o envio de uma mensagem para a queue e processamento pelo worker
 */

import { messageQueue } from '../config/redis';
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
};

async function testMessageQueue() {
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}Message Queue Integration Test${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`);

  try {
    // Check if queue is available
    if (!messageQueue) {
      console.log(`${colors.yellow}⚠️  Message queue is disabled (production without Redis)${colors.reset}`);
      console.log(`${colors.cyan}   Messages will be processed synchronously${colors.reset}\n`);
      return;
    }

    console.log(`${colors.green}✓ Message queue is available${colors.reset}\n`);

    // Simulate a WhatsApp message
    const mockMessage = {
      organizationId: 'test-org-123',
      instanceId: 'test-instance-456',
      message: {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          id: `TEST_MSG_${Date.now()}`,
          fromMe: false,
        },
        message: {
          conversation: 'Olá! Gostaria de saber mais sobre os produtos.',
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    };

    console.log(`${colors.blue}[INFO] Adding test message to queue...${colors.reset}`);
    console.log(`${colors.cyan}  Organization: ${mockMessage.organizationId}${colors.reset}`);
    console.log(`${colors.cyan}  Instance: ${mockMessage.instanceId}${colors.reset}`);
    console.log(`${colors.cyan}  From: ${mockMessage.message.key.remoteJid}${colors.reset}`);
    console.log(`${colors.cyan}  Content: ${mockMessage.message.message.conversation}${colors.reset}\n`);

    // Add message to queue
    const job = await messageQueue.add('process-message', mockMessage, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    console.log(`${colors.green}✓ Message added to queue (Job ID: ${job.id})${colors.reset}\n`);

    // Get queue stats
    const waiting = await messageQueue.getWaitingCount();
    const active = await messageQueue.getActiveCount();
    const completed = await messageQueue.getCompletedCount();
    const failed = await messageQueue.getFailedCount();

    console.log(`${colors.bright}Queue Statistics:${colors.reset}`);
    console.log(`${colors.cyan}  Waiting: ${waiting}${colors.reset}`);
    console.log(`${colors.cyan}  Active: ${active}${colors.reset}`);
    console.log(`${colors.cyan}  Completed: ${completed}${colors.reset}`);
    console.log(`${colors.cyan}  Failed: ${failed}${colors.reset}\n`);

    console.log(`${colors.yellow}⚠️  Note: This test only adds a job to the queue.${colors.reset}`);
    console.log(`${colors.yellow}   To process it, you need to start the worker with: npm run worker${colors.reset}\n`);

    // Check job state after 2 seconds
    console.log(`${colors.blue}[INFO] Checking job state...${colors.reset}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const jobState = await job.getState();
    console.log(`${colors.cyan}  Job state: ${jobState}${colors.reset}\n`);

    if (jobState === 'waiting') {
      console.log(`${colors.yellow}✓ Job is waiting for worker to process${colors.reset}`);
      console.log(`${colors.yellow}  Start the worker with: npm run worker${colors.reset}\n`);
    } else if (jobState === 'completed') {
      console.log(`${colors.green}✓ Job completed successfully!${colors.reset}\n`);
      const result = await job.returnvalue;
      console.log(`${colors.cyan}  Result: ${JSON.stringify(result, null, 2)}${colors.reset}\n`);
    } else if (jobState === 'failed') {
      console.log(`${colors.red}✗ Job failed${colors.reset}\n`);
      const failedReason = job.failedReason;
      console.log(`${colors.red}  Reason: ${failedReason}${colors.reset}\n`);
    }

    console.log(`${colors.green}${colors.bright}✓ TEST COMPLETED${colors.reset}\n`);
  } catch (error: any) {
    console.log(`${colors.red}✗ TEST FAILED${colors.reset}\n`);
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

// Run test
testMessageQueue()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
