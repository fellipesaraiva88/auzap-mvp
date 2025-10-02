import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

// Upstash Redis (para produção com REST API)
const upstashRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Conexão Redis (ioredis para BullMQ)
const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  : new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

// Fila de mensagens
export const messageQueue = new Queue('messages', { connection });

export { connection, upstashRedis };
