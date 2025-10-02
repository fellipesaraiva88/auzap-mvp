import { Queue, Worker, QueueEvents } from 'bullmq';
import { getTestContext, resetTestData } from './setup';
import IORedis from 'ioredis';

describe('Queue Operations (BullMQ)', () => {
  let testQueue: Queue;
  let testWorker: Worker;
  let queueEvents: QueueEvents;
  let connection: IORedis;

  beforeAll(async () => {
    // Setup Redis connection
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      connection = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
      });
    } else {
      connection = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
      });
    }

    // Create test queue
    testQueue = new Queue('test-queue', { connection });
    queueEvents = new QueueEvents('test-queue', { connection });

    // Wait for queue to be ready
    await testQueue.waitUntilReady();
  });

  afterAll(async () => {
    // Cleanup
    if (testWorker) {
      await testWorker.close();
    }
    if (queueEvents) {
      await queueEvents.close();
    }
    if (testQueue) {
      await testQueue.obliterate({ force: true });
      await testQueue.close();
    }
    if (connection) {
      await connection.quit();
    }
  });

  beforeEach(async () => {
    await resetTestData();
    // Clean queue before each test
    await testQueue.drain();
  });

  describe('Add Job to Queue', () => {
    it('should add a job successfully', async () => {
      const jobData = {
        type: 'test-job',
        payload: { message: 'Hello World' },
      };

      const job = await testQueue.add('test-job', jobData);

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data).toEqual(jobData);
      expect(job.name).toBe('test-job');
    });

    it('should add job with options', async () => {
      const jobData = { test: 'data' };
      const options = {
        delay: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential' as const,
          delay: 2000,
        },
      };

      const job = await testQueue.add('delayed-job', jobData, options);

      expect(job).toBeDefined();
      expect(job.opts.delay).toBe(1000);
      expect(job.opts.attempts).toBe(3);
    });

    it('should add job with priority', async () => {
      const lowPriorityJob = await testQueue.add(
        'low-priority',
        { priority: 'low' },
        { priority: 10 }
      );

      const highPriorityJob = await testQueue.add(
        'high-priority',
        { priority: 'high' },
        { priority: 1 }
      );

      expect(lowPriorityJob.opts.priority).toBe(10);
      expect(highPriorityJob.opts.priority).toBe(1);
    });
  });

  describe('Process Jobs', () => {
    it('should process a job successfully', async () => {
      const jobData = { message: 'Process me' };
      let processedData: any = null;

      // Create worker to process jobs
      testWorker = new Worker(
        'test-queue',
        async (job) => {
          processedData = job.data;
          return { success: true, processed: job.data };
        },
        { connection }
      );

      // Add job
      const job = await testQueue.add('process-test', jobData);

      // Wait for job to complete
      const completed = await job.waitUntilFinished(queueEvents, 5000);

      expect(completed).toBeDefined();
      expect(completed.success).toBe(true);
      expect(processedData).toEqual(jobData);
    });

    it('should handle job failure and retry', async () => {
      let attemptCount = 0;

      testWorker = new Worker(
        'test-queue',
        async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Simulated failure');
          }
          return { success: true, attempts: attemptCount };
        },
        { connection }
      );

      const job = await testQueue.add(
        'retry-test',
        { test: 'retry' },
        { attempts: 3, backoff: { type: 'fixed', delay: 100 } }
      );

      const result = await job.waitUntilFinished(queueEvents, 10000);

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('should fail job after max attempts', async () => {
      testWorker = new Worker(
        'test-queue',
        async () => {
          throw new Error('Always fails');
        },
        { connection }
      );

      const job = await testQueue.add(
        'fail-test',
        { test: 'fail' },
        { attempts: 2, backoff: { type: 'fixed', delay: 100 } }
      );

      try {
        await job.waitUntilFinished(queueEvents, 5000);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Always fails');
      }

      const failedJob = await job.isFailed();
      expect(failedJob).toBe(true);
    });
  });

  describe('Queue Management', () => {
    it('should get queue counts', async () => {
      await testQueue.add('job1', { data: 1 });
      await testQueue.add('job2', { data: 2 });
      await testQueue.add('job3', { data: 3 });

      const counts = await testQueue.getJobCounts('waiting', 'active', 'completed', 'failed');

      expect(counts.waiting).toBeGreaterThanOrEqual(0);
      expect(counts).toHaveProperty('active');
      expect(counts).toHaveProperty('completed');
      expect(counts).toHaveProperty('failed');
    });

    it('should pause and resume queue', async () => {
      await testQueue.pause();
      const isPaused = await testQueue.isPaused();
      expect(isPaused).toBe(true);

      await testQueue.resume();
      const isResumed = await testQueue.isPaused();
      expect(isResumed).toBe(false);
    });

    it('should get jobs by status', async () => {
      await testQueue.add('waiting-job-1', { status: 'waiting' });
      await testQueue.add('waiting-job-2', { status: 'waiting' });

      const waitingJobs = await testQueue.getWaiting();

      expect(waitingJobs).toBeDefined();
      expect(waitingJobs.length).toBeGreaterThanOrEqual(2);
    });

    it('should remove a job', async () => {
      const job = await testQueue.add('remove-test', { data: 'remove me' });

      await job.remove();

      const retrievedJob = await testQueue.getJob(job.id!);
      expect(retrievedJob).toBeNull();
    });
  });

  describe('Message Processing Queue', () => {
    it('should queue a message processing job', async () => {
      const { testOrgId } = getTestContext();

      const messageData = {
        organizationId: testOrgId,
        contactPhone: '+5511999999999',
        message: 'Test message',
        messageId: 'test-msg-123',
      };

      const job = await testQueue.add('process-message', messageData);

      expect(job).toBeDefined();
      expect(job.data.organizationId).toBe(testOrgId);
      expect(job.data.message).toBe(messageData.message);
    });

    it('should validate message processing result', async () => {
      const { testOrgId } = getTestContext();

      testWorker = new Worker(
        'test-queue',
        async (job) => {
          // Simulate message processing
          const { organizationId, contactPhone, message } = job.data;

          // Validate required fields
          if (!organizationId || !contactPhone || !message) {
            throw new Error('Missing required fields');
          }

          // Simulate AI response
          const aiResponse = `Echo: ${message}`;

          return {
            success: true,
            organizationId,
            contactPhone,
            originalMessage: message,
            aiResponse,
            processedAt: new Date().toISOString(),
          };
        },
        { connection }
      );

      const job = await testQueue.add('process-message', {
        organizationId: testOrgId,
        contactPhone: '+5511999999999',
        message: 'Hello',
      });

      const result = await job.waitUntilFinished(queueEvents, 5000);

      expect(result.success).toBe(true);
      expect(result.aiResponse).toContain('Echo: Hello');
      expect(result.organizationId).toBe(testOrgId);
    });
  });

  describe('Job Events', () => {
    it('should emit job completed event', async () => {
      let completedJobId: string | undefined;

      queueEvents.on('completed', ({ jobId }) => {
        completedJobId = jobId;
      });

      testWorker = new Worker(
        'test-queue',
        async () => {
          return { success: true };
        },
        { connection }
      );

      const job = await testQueue.add('event-test', { test: 'event' });
      await job.waitUntilFinished(queueEvents, 5000);

      // Give event time to emit
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(completedJobId).toBe(job.id);
    });

    it('should emit job failed event', async () => {
      let failedJobId: string | undefined;
      let failedError: string | undefined;

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        failedJobId = jobId;
        failedError = failedReason;
      });

      testWorker = new Worker(
        'test-queue',
        async () => {
          throw new Error('Test error');
        },
        { connection }
      );

      const job = await testQueue.add('fail-event-test', { test: 'fail' }, { attempts: 1 });

      try {
        await job.waitUntilFinished(queueEvents, 5000);
      } catch (error) {
        // Expected to fail
      }

      // Give event time to emit
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(failedJobId).toBe(job.id);
      expect(failedError).toContain('Test error');
    });
  });
});
