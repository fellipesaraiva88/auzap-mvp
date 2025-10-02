import messageProcessor from './message-processor';
import followupScheduler from './followup-scheduler';
import auroraProactive, { setupProactiveSchedules } from './aurora-proactive';
import { logger } from '../config/logger';

/**
 * Inicializar todos os workers
 */
export function startWorkers() {
  // Skip workers em produção sem Redis
  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    logger.warn('⚠️  Redis not configured - workers disabled in production');
    logger.info('💡 Messages will be processed synchronously');
    return {
      messageProcessor: null,
      followupScheduler: null,
      auroraProactive: null,
      cronJobs: null,
    };
  }

  logger.info('🚀 Starting all workers...');

  // ===== MESSAGE PROCESSOR WORKER =====
  messageProcessor.on('ready', () => {
    logger.info('✅ Message processor worker ready');
  });

  messageProcessor.on('active', (job) => {
    logger.info(
      { jobId: job.id, attemptsMade: job.attemptsMade },
      '🔄 Processing message job'
    );
  });

  messageProcessor.on('completed', (job) => {
    logger.info(
      {
        jobId: job.id,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        duration: job.finishedOn ? job.finishedOn - (job.processedOn || 0) : 0,
      },
      '✅ Message processed successfully'
    );
  });

  messageProcessor.on('failed', (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        jobName: job?.name,
        attemptsMade: job?.attemptsMade,
        failedReason: job?.failedReason,
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
        data: job?.data,
      },
      '❌ Message processing failed'
    );
  });

  messageProcessor.on('error', (err) => {
    logger.error(
      {
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
      },
      '⚠️  Message processor worker error'
    );
  });

  messageProcessor.on('stalled', (jobId) => {
    logger.warn({ jobId }, '⏸️  Message job stalled (possibly timed out)');
  });

  messageProcessor.on('progress', (job, progress) => {
    logger.debug(
      { jobId: job.id, progress },
      '📊 Message job progress updated'
    );
  });

  // ===== FOLLOW-UP SCHEDULER WORKER =====
  followupScheduler.on('ready', () => {
    logger.info('✅ Follow-up scheduler worker ready');
  });

  followupScheduler.on('active', (job) => {
    logger.info(
      { jobId: job.id, attemptsMade: job.attemptsMade },
      '🔄 Processing follow-up job'
    );
  });

  followupScheduler.on('completed', (job) => {
    logger.info(
      {
        jobId: job.id,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        duration: job.finishedOn ? job.finishedOn - (job.processedOn || 0) : 0,
      },
      '✅ Follow-up scheduled successfully'
    );
  });

  followupScheduler.on('failed', (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        jobName: job?.name,
        attemptsMade: job?.attemptsMade,
        failedReason: job?.failedReason,
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
        data: job?.data,
      },
      '❌ Follow-up scheduling failed'
    );
  });

  followupScheduler.on('error', (err) => {
    logger.error(
      {
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
      },
      '⚠️  Follow-up scheduler worker error'
    );
  });

  followupScheduler.on('stalled', (jobId) => {
    logger.warn({ jobId }, '⏸️  Follow-up job stalled (possibly timed out)');
  });

  // ===== AURORA PROACTIVE WORKER =====
  auroraProactive.on('ready', () => {
    logger.info('✅ Aurora proactive worker ready');
  });

  auroraProactive.on('active', (job) => {
    logger.info(
      { jobId: job.id, attemptsMade: job.attemptsMade },
      '🔄 Processing Aurora proactive job'
    );
  });

  auroraProactive.on('completed', (job) => {
    logger.info(
      {
        jobId: job.id,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        duration: job.finishedOn ? job.finishedOn - (job.processedOn || 0) : 0,
      },
      '✅ Aurora proactive job completed'
    );
  });

  auroraProactive.on('failed', (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        jobName: job?.name,
        attemptsMade: job?.attemptsMade,
        failedReason: job?.failedReason,
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
        data: job?.data,
      },
      '❌ Aurora proactive job failed'
    );
  });

  auroraProactive.on('error', (err) => {
    logger.error(
      {
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
      },
      '⚠️  Aurora proactive worker error'
    );
  });

  auroraProactive.on('stalled', (jobId) => {
    logger.warn(
      { jobId },
      '⏸️  Aurora proactive job stalled (possibly timed out)'
    );
  });

  // Configurar cron jobs
  const cronJobs = setupProactiveSchedules();
  logger.info('✅ Proactive cron jobs configured');
  logger.info('   - Daily summary: 18:00');
  logger.info('   - Birthdays: 09:00');
  logger.info('   - Inactive clients: Monday 10:00');
  logger.info('   - Opportunities: Tuesday/Thursday 15:00');

  return {
    messageProcessor,
    followupScheduler,
    auroraProactive,
    cronJobs,
  };
}

/**
 * Graceful shutdown
 */
export async function stopWorkers() {
  logger.info('🛑 Stopping all workers...');

  await messageProcessor.close();
  logger.info('✅ Message processor stopped');

  await followupScheduler.close();
  logger.info('✅ Follow-up scheduler stopped');

  await auroraProactive.close();
  logger.info('✅ Aurora proactive stopped');

  logger.info('✅ All workers stopped');
}
