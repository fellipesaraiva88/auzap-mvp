import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('Missing REDIS_URL environment variable');
}

// Redis connection options with TLS for Upstash
const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {
    rejectUnauthorized: false
  },
  family: 6
};

// Redis connection for BullMQ (compartilhado por todas as filas)
export const redisConnection = new Redis(redisUrl, redisOptions);

// Redis client for caching (separado para operações de cache)
export const redisCache = new Redis(redisUrl, {
  tls: {
    rejectUnauthorized: false
  },
  family: 6
});
