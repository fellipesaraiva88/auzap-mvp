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

  // Worker de mensagens
  messageProcessor.on('ready', () => {
    logger.info('✅ Message processor worker ready');
  });

  messageProcessor.on('completed', (job) => {
    logger.info({ jobId: job.id }, '✅ Message processed successfully');
  });

  messageProcessor.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, '❌ Message processing failed');
  });

  // Worker de follow-ups
  followupScheduler.on('ready', () => {
    logger.info('✅ Follow-up scheduler worker ready');
  });

  followupScheduler.on('completed', (job) => {
    logger.info({ jobId: job.id }, '✅ Follow-up scheduled successfully');
  });

  followupScheduler.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, '❌ Follow-up scheduling failed');
  });

  // Worker proativo Aurora
  auroraProactive.on('ready', () => {
    logger.info('✅ Aurora proactive worker ready');
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
