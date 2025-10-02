import { Redis } from 'ioredis';
import { Queue, Worker, QueueEvents } from 'bullmq';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('Missing REDIS_URL environment variable');
}

// Redis connection for BullMQ
export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Redis client for caching
export const redisCache = new Redis(redisUrl);

// Queue for message processing
export const messageQueue = new Queue('message-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600 // 24 hours
    },
    removeOnFail: {
      count: 500
    }
  }
});

// Queue for scheduled followups
export const followupQueue = new Queue('followup-scheduler', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

// Queue for Aurora proactive messages
export const auroraQueue = new Queue('aurora-proactive', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000
    }
  }
});

// Queue events for monitoring
export const messageQueueEvents = new QueueEvents('message-processing', {
  connection: redisConnection
});

export { Worker };
