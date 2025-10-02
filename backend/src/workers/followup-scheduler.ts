import { Worker, Queue } from 'bullmq';
import { connection } from '../config/redis';
import { supabase } from '../config/supabase';
import { FollowupsService } from '../services/followups.service';
import { logger } from '../config/logger';

/**
 * Fila de follow-ups
 */
export const followupQueue = new Queue('followups', { connection });

/**
 * Worker para processar follow-ups agendados
 * Verifica a cada 30 minutos por follow-ups pendentes
 */
const followupScheduler = new Worker(
  'followup-scheduler',
  async (job) => {
    const { organizationId } = job.data;

    try {
      logger.info({ jobId: job.id, organizationId }, 'Starting followup scheduler');

      // Buscar todas as organizações se não especificada
      let organizations: string[] = [];

      if (organizationId) {
        organizations = [organizationId];
      } else {
        const { data: orgs, error } = await supabase
          .from('organizations')
          .select('id')
          .eq('active', true);

        if (error) throw error;
        organizations = orgs.map((org) => org.id);
      }

      let totalProcessed = 0;
      let totalSent = 0;
      let totalFailed = 0;

      // Processar cada organização
      for (const orgId of organizations) {
        try {
          // Buscar follow-ups pendentes
          const pendingFollowups = await FollowupsService.getPendingFollowups(orgId);

          logger.info(
            { organizationId: orgId, count: pendingFollowups.length },
            'Found pending followups'
          );

          // Processar cada follow-up
          for (const followup of pendingFollowups) {
            try {
              totalProcessed++;

              // Processar follow-up (enviar mensagem)
              const result = await FollowupsService.processFollowup(followup.id);

              if (result.success) {
                totalSent++;
                logger.info(
                  { followupId: followup.id, type: followup.followup_type },
                  'Followup sent successfully'
                );
              }
            } catch (followupError: any) {
              totalFailed++;
              logger.error(
                {
                  error: followupError,
                  followupId: followup.id,
                  organizationId: orgId,
                },
                'Error processing individual followup'
              );

              // Marcar como falha
              await supabase
                .from('scheduled_followups')
                .update({
                  status: 'failed',
                  error_message: followupError.message,
                })
                .eq('id', followup.id);
            }
          }
        } catch (orgError: any) {
          logger.error(
            { error: orgError, organizationId: orgId },
            'Error processing organization followups'
          );
        }
      }

      logger.info(
        {
          jobId: job.id,
          totalProcessed,
          totalSent,
          totalFailed,
          organizations: organizations.length,
        },
        'Followup scheduler completed'
      );

      return {
        success: true,
        totalProcessed,
        totalSent,
        totalFailed,
        organizations: organizations.length,
      };
    } catch (error: any) {
      logger.error(
        { error, jobId: job.id, organizationId },
        'Critical error in followup scheduler'
      );
      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Um scheduler por vez
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  }
);

/**
 * Worker para processar follow-ups individuais da fila
 */
const followupWorker = new Worker(
  'followups',
  async (job) => {
    const { followupId } = job.data;

    try {
      logger.info({ jobId: job.id, followupId }, 'Processing followup from queue');

      const result = await FollowupsService.processFollowup(followupId);

      logger.info({ jobId: job.id, followupId }, 'Followup processed from queue');

      return result;
    } catch (error: any) {
      logger.error(
        { error, jobId: job.id, followupId },
        'Error processing followup from queue'
      );

      // Marcar como falha
      await supabase
        .from('scheduled_followups')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', followupId);

      throw error;
    }
  },
  {
    connection,
    concurrency: 3, // Processa até 3 follow-ups simultaneamente
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  }
);

// Event handlers para scheduler
followupScheduler.on('completed', (job) => {
  logger.info({ jobId: job.id }, '✅ Followup scheduler completed');
});

followupScheduler.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, '❌ Followup scheduler failed');
});

// Event handlers para worker
followupWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, '✅ Followup job completed');
});

followupWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, '❌ Followup job failed');
});

/**
 * Agendar job recorrente (a cada 30 minutos)
 */
export async function startFollowupScheduler() {
  try {
    // Remover jobs antigos
    await followupQueue.obliterate({ force: true });

    // Adicionar job recorrente - executa a cada 30 minutos
    await followupQueue.add(
      'check-pending-followups',
      {},
      {
        repeat: {
          pattern: '*/30 * * * *', // A cada 30 minutos
        },
        jobId: 'followup-scheduler-recurring',
      }
    );

    logger.info('Followup scheduler started - running every 30 minutes');

    // Executar imediatamente uma vez
    await followupQueue.add('check-pending-followups', {}, { jobId: 'followup-scheduler-initial' });

    return { success: true };
  } catch (error) {
    logger.error({ error }, 'Error starting followup scheduler');
    throw error;
  }
}

/**
 * Parar scheduler
 */
export async function stopFollowupScheduler() {
  try {
    await followupScheduler.close();
    await followupWorker.close();
    logger.info('Followup scheduler stopped');
    return { success: true };
  } catch (error) {
    logger.error({ error }, 'Error stopping followup scheduler');
    throw error;
  }
}

/**
 * Adicionar follow-up individual à fila
 */
export async function queueFollowup(followupId: string, delay: number = 0) {
  try {
    await followupQueue.add(
      'process-followup',
      { followupId },
      {
        delay, // Delay em ms
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 25s, 125s
        },
      }
    );

    logger.info({ followupId, delay }, 'Followup queued');
    return { success: true };
  } catch (error) {
    logger.error({ error, followupId }, 'Error queueing followup');
    throw error;
  }
}

export { followupScheduler, followupWorker };
export default followupScheduler;
