import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

// Upstash Redis (para produção com REST API)
const upstashRedis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new UpstashRedis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Conexão Redis (ioredis para BullMQ)
// Em produção sem REDIS_URL, usar configuração mínima (workers síncronos)
const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: {
        rejectUnauthorized: false, // Upstash requires TLS
      },
    })
  : process.env.NODE_ENV === 'production'
    ? new IORedis({
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null,
        lazyConnect: true, // Não conectar imediatamente em produção
        enableOfflineQueue: false,
      })
    : new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
      });

// Fila de mensagens (opcional em produção sem Redis)
export const messageQueue =
  process.env.NODE_ENV === 'production' && !process.env.REDIS_URL
    ? null
    : new Queue('messages', {
        connection,
        defaultJobOptions: {
          attempts: 3, // 3 tentativas
          backoff: {
            type: 'exponential',
            delay: 2000, // 2s inicial, depois 4s, depois 8s
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      });

export { connection, upstashRedis };
