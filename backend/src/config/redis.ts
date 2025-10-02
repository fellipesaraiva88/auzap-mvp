import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// Conexão Redis
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

export { connection };
