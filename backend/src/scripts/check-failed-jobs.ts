#!/usr/bin/env ts-node
/* eslint-disable no-console */
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: { rejectUnauthorized: false },
    })
  : new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

const messageQueue = new Queue('messages', { connection });

async function checkFailedJobs() {
  console.log('🔍 Checking failed jobs...\n');

  const failed = await messageQueue.getFailed(0, 10);

  if (failed.length === 0) {
    console.log('✅ No failed jobs found');
    await connection.quit();
    process.exit(0);
  }

  console.log(`❌ Found ${failed.length} failed jobs:\n`);

  for (const job of failed) {
    console.log(`Job ID: ${job.id}`);
    console.log(`Failed Reason: ${job.failedReason}`);
    console.log(`Stack Trace:`);

    const stackTrace = job.stacktrace;
    if (stackTrace && stackTrace.length > 0) {
      stackTrace.forEach((trace, i) => {
        console.log(`\n  Attempt ${i + 1}:`);
        console.log(`  ${trace}`);
      });
    }

    console.log(`\nData:`, JSON.stringify(job.data, null, 2));
    console.log('\n' + '-'.repeat(60) + '\n');
  }

  await connection.quit();
  process.exit(1);
}

checkFailedJobs().catch(console.error);
