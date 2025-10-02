/**
 * Script de teste para Redis e BullMQ
 *
 * Testa:
 * 1. Conexão Upstash Redis
 * 2. BullMQ Queue
 * 3. Worker processing
 * 4. Job completion
 */

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';
import { logger } from '../config/logger';
import dotenv from 'dotenv';

dotenv.config();

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  error?: any;
  duration?: number;
}

const results: TestResult[] = [];

/**
 * Teste 1: Upstash Redis REST API
 */
async function testUpstashRedis(): Promise<TestResult> {
  const start = Date.now();
  console.log(`\n${colors.blue}[TEST 1] Testing Upstash Redis REST API...${colors.reset}`);

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash credentials not found in .env');
    }

    const upstash = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Test SET
    const testKey = `test:${Date.now()}`;
    const testValue = 'Hello from AuZap!';
    await upstash.set(testKey, testValue);
    console.log(`${colors.cyan}  ✓ SET ${testKey}${colors.reset}`);

    // Test GET
    const retrieved = await upstash.get(testKey);
    if (retrieved !== testValue) {
      throw new Error(`Value mismatch: expected ${testValue}, got ${retrieved}`);
    }
    console.log(`${colors.cyan}  ✓ GET ${testKey} = ${retrieved}${colors.reset}`);

    // Test DEL
    await upstash.del(testKey);
    console.log(`${colors.cyan}  ✓ DEL ${testKey}${colors.reset}`);

    // Test PING
    const pong = await upstash.ping();
    console.log(`${colors.cyan}  ✓ PING = ${pong}${colors.reset}`);

    const duration = Date.now() - start;
    console.log(`${colors.green}[TEST 1] ✓ Upstash Redis OK (${duration}ms)${colors.reset}`);

    return {
      name: 'Upstash Redis REST API',
      success: true,
      message: 'All operations successful',
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - start;
    console.log(`${colors.red}[TEST 1] ✗ Upstash Redis FAILED (${duration}ms)${colors.reset}`);
    console.error(`${colors.red}  Error: ${error.message}${colors.reset}`);

    return {
      name: 'Upstash Redis REST API',
      success: false,
      message: error.message,
      error,
      duration,
    };
  }
}

/**
 * Teste 2: IORedis Connection (para BullMQ)
 */
async function testIORedisConnection(): Promise<TestResult> {
  const start = Date.now();
  console.log(`\n${colors.blue}[TEST 2] Testing IORedis Connection...${colors.reset}`);

  let connection: IORedis | null = null;

  try {
    // Tentar conectar ao Redis local ou usar REDIS_URL se disponível
    if (process.env.REDIS_URL) {
      console.log(`${colors.cyan}  Using REDIS_URL${colors.reset}`);
      connection = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        tls: {
          rejectUnauthorized: false, // Upstash requires TLS
        },
      });
    } else {
      console.log(`${colors.cyan}  Using local Redis (${process.env.REDIS_HOST}:${process.env.REDIS_PORT})${colors.reset}`);
      connection = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
      });
    }

    // Test PING
    const pong = await connection.ping();
    console.log(`${colors.cyan}  ✓ PING = ${pong}${colors.reset}`);

    // Test SET/GET
    const testKey = `test:ioredis:${Date.now()}`;
    await connection.set(testKey, 'test-value');
    console.log(`${colors.cyan}  ✓ SET ${testKey}${colors.reset}`);

    const value = await connection.get(testKey);
    console.log(`${colors.cyan}  ✓ GET ${testKey} = ${value}${colors.reset}`);

    await connection.del(testKey);
    console.log(`${colors.cyan}  ✓ DEL ${testKey}${colors.reset}`);

    const duration = Date.now() - start;
    console.log(`${colors.green}[TEST 2] ✓ IORedis Connection OK (${duration}ms)${colors.reset}`);

    await connection.quit();

    return {
      name: 'IORedis Connection',
      success: true,
      message: 'Connection successful',
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - start;
    console.log(`${colors.red}[TEST 2] ✗ IORedis Connection FAILED (${duration}ms)${colors.reset}`);
    console.error(`${colors.red}  Error: ${error.message}${colors.reset}`);

    if (connection) {
      try {
        await connection.quit();
      } catch (e) {
        // Ignore
      }
    }

    return {
      name: 'IORedis Connection',
      success: false,
      message: error.message,
      error,
      duration,
    };
  }
}

/**
 * Teste 3: BullMQ Queue and Worker
 */
async function testBullMQ(): Promise<TestResult> {
  const start = Date.now();
  console.log(`\n${colors.blue}[TEST 3] Testing BullMQ Queue and Worker...${colors.reset}`);

  let connection: IORedis | null = null;
  let queue: Queue | null = null;
  let worker: Worker | null = null;

  try {
    // Create connection
    if (process.env.REDIS_URL) {
      connection = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        tls: {
          rejectUnauthorized: false, // Upstash requires TLS
        },
      });
    } else {
      connection = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
      });
    }

    console.log(`${colors.cyan}  ✓ Connection created${colors.reset}`);

    // Create queue
    queue = new Queue('test-queue', { connection });
    console.log(`${colors.cyan}  ✓ Queue created${colors.reset}`);

    // Create worker
    let jobProcessed = false;
    let processedData: any = null;

    worker = new Worker(
      'test-queue',
      async (job) => {
        console.log(`${colors.cyan}  ✓ Worker processing job ${job.id}${colors.reset}`);
        console.log(`${colors.cyan}    Data: ${JSON.stringify(job.data)}${colors.reset}`);

        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 500));

        processedData = job.data;
        jobProcessed = true;

        return { success: true, processed: job.data };
      },
      {
        connection,
        concurrency: 1,
      }
    );

    console.log(`${colors.cyan}  ✓ Worker created${colors.reset}`);

    // Wait for worker to be ready
    await new Promise<void>((resolve) => {
      worker!.on('ready', () => {
        console.log(`${colors.cyan}  ✓ Worker ready${colors.reset}`);
        resolve();
      });
    });

    // Add a test job
    const jobData = {
      test: true,
      message: 'Hello from BullMQ test!',
      timestamp: Date.now(),
    };

    const job = await queue.add('test-job', jobData);
    console.log(`${colors.cyan}  ✓ Job added (ID: ${job.id})${colors.reset}`);

    // Wait for job to complete (max 5 seconds)
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Job processing timeout'));
      }, 5000);

      worker!.on('completed', (job) => {
        console.log(`${colors.cyan}  ✓ Job completed (ID: ${job.id})${colors.reset}`);
        clearTimeout(timeout);
        resolve();
      });

      worker!.on('failed', (job, err) => {
        console.log(`${colors.red}  ✗ Job failed (ID: ${job?.id})${colors.reset}`);
        console.error(`${colors.red}    Error: ${err.message}${colors.reset}`);
        clearTimeout(timeout);
        reject(err);
      });
    });

    if (!jobProcessed) {
      throw new Error('Job was not processed');
    }

    console.log(`${colors.cyan}  ✓ Job data verified: ${JSON.stringify(processedData)}${colors.reset}`);

    // Cleanup
    await worker.close();
    await queue.close();
    await connection.quit();

    const duration = Date.now() - start;
    console.log(`${colors.green}[TEST 3] ✓ BullMQ OK (${duration}ms)${colors.reset}`);

    return {
      name: 'BullMQ Queue and Worker',
      success: true,
      message: 'Job processed successfully',
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - start;
    console.log(`${colors.red}[TEST 3] ✗ BullMQ FAILED (${duration}ms)${colors.reset}`);
    console.error(`${colors.red}  Error: ${error.message}${colors.reset}`);

    // Cleanup
    if (worker) {
      try {
        await worker.close();
      } catch (e) {
        // Ignore
      }
    }
    if (queue) {
      try {
        await queue.close();
      } catch (e) {
        // Ignore
      }
    }
    if (connection) {
      try {
        await connection.quit();
      } catch (e) {
        // Ignore
      }
    }

    return {
      name: 'BullMQ Queue and Worker',
      success: false,
      message: error.message,
      error,
      duration,
    };
  }
}

/**
 * Print summary
 */
function printSummary(results: TestResult[]) {
  console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`);

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  results.forEach((result, index) => {
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? colors.green : colors.red;
    const duration = result.duration ? ` (${result.duration}ms)` : '';

    console.log(`${color}${icon} [${index + 1}] ${result.name}${duration}${colors.reset}`);
    console.log(`   ${result.message}`);
    if (result.error) {
      console.log(`   ${colors.red}Error: ${result.error.message}${colors.reset}`);
    }
    console.log('');
  });

  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}RESULTS: ${passed} passed, ${failed} failed${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`);

  const allPassed = failed === 0;
  if (allPassed) {
    console.log(`${colors.green}${colors.bright}🎉 ALL TESTS PASSED!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}❌ SOME TESTS FAILED${colors.reset}\n`);
  }

  return allPassed;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}Redis + BullMQ Test Suite${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}Environment: ${process.env.NODE_ENV || 'development'}${colors.reset}`);
  console.log(`${colors.cyan}Redis Host: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}${colors.reset}`);
  console.log(`${colors.cyan}Upstash URL: ${process.env.UPSTASH_REDIS_REST_URL || 'not configured'}${colors.reset}`);

  // Run tests sequentially
  results.push(await testUpstashRedis());
  results.push(await testIORedisConnection());
  results.push(await testBullMQ());

  // Print summary
  const allPassed = printSummary(results);

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
