import dotenv from 'dotenv';
dotenv.config();

import { logger } from '../config/logger';
import messageWorker from './message-processor';
import {
  followupScheduler,
  followupWorker,
  startFollowupScheduler,
  stopFollowupScheduler,
} from './followup-scheduler';
import auroraProactiveWorker, { setupProactiveSchedules } from './aurora-proactive';

logger.info('🚀 Starting AuZap Workers...');

// Iniciar scheduler de follow-ups
startFollowupScheduler()
  .then(() => {
    logger.info('✅ Followup scheduler started');
  })
  .catch((error) => {
    logger.error({ error }, '❌ Error starting followup scheduler');
  });

// Iniciar schedules proativos da Aurora
const proactiveJobs = setupProactiveSchedules();
logger.info('✅ Aurora proactive schedules configured');

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing workers...');
  await messageWorker.close();
  await auroraProactiveWorker.close();
  await stopFollowupScheduler();

  // Parar cron jobs
  proactiveJobs.dailySummaryJob.stop();
  proactiveJobs.birthdaysJob.stop();
  proactiveJobs.inactiveClientsJob.stop();
  proactiveJobs.opportunitiesJob.stop();

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing workers...');
  await messageWorker.close();
  await auroraProactiveWorker.close();
  await stopFollowupScheduler();

  // Parar cron jobs
  proactiveJobs.dailySummaryJob.stop();
  proactiveJobs.birthdaysJob.stop();
  proactiveJobs.inactiveClientsJob.stop();
  proactiveJobs.opportunitiesJob.stop();

  process.exit(0);
});

logger.info('✅ Workers running');
