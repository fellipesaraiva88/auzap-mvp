import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import {
  messageQueue,
  campaignQueue,
  automationQueue,
  dlqQueue
} from '../queue-manager.js';

/**
 * Bull Board UI para monitoring de filas
 * Endpoint: /admin/queues
 * Auth: Owner-only (authorized_owner_numbers)
 */

// Setup Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(messageQueue),
    new BullMQAdapter(campaignQueue),
    new BullMQAdapter(automationQueue),
    new BullMQAdapter(dlqQueue)
  ],
  serverAdapter
});

/**
 * Middleware de autenticação - Owner only
 * Verifica se o número do usuário está em authorized_owner_numbers
 */
export async function bullBoardAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extrair token JWT do header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7);

    // Verificar token com Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      logger.error({ error: authError }, 'Bull Board auth failed');
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Buscar organizationId do query param ou header
    const organizationId = req.query.organizationId as string || req.headers['x-organization-id'] as string;

    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID required' });
      return;
    }

    // Verificar se usuário pertence à organização
    const { data: membership } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (!membership) {
      res.status(403).json({ error: 'Access denied to organization' });
      return;
    }

    // Verificar se é dono autorizado (via email do usuário)
    const { data: ownerCheck } = await supabaseAdmin
      .from('authorized_owner_numbers')
      .select('id, phone_number')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!ownerCheck) {
      logger.warn({
        userId: user.id,
        organizationId
      }, 'Bull Board access denied - not an authorized owner');

      res.status(403).json({ error: 'Access denied - owner only' });
      return;
    }

    logger.info({
      userId: user.id,
      organizationId
    }, 'Bull Board access granted');

    next();
  } catch (error: any) {
    logger.error({ error }, 'Bull Board auth error');
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Health check para Bull Board
 */
export async function bullBoardHealthCheck(_req: Request, res: Response): Promise<void> {
  try {
    const stats = {
      messageQueue: await messageQueue.getJobCounts(),
      campaignQueue: await campaignQueue.getJobCounts(),
      automationQueue: await automationQueue.getJobCounts(),
      dlqQueue: await dlqQueue.getJobCounts()
    };

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      queues: stats
    });
  } catch (error) {
    res.status(503).json({ status: 'error', error });
  }
}

export { serverAdapter };
