import { Router, Response } from 'express';
import { AuroraService } from '../services/aurora/aurora.service.js';
import { auroraProactiveService } from '../services/aurora/aurora-proactive.service.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';
import { auroraAuthMiddleware } from '../middleware/aurora-auth.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';
import { logger } from '../config/logger.js';

const router = Router();
const auroraService = new AuroraService();

// Aplicar tenant middleware PRIMEIRO, depois Aurora auth
router.use(tenantMiddleware);
router.use(standardLimiter);
router.use(auroraAuthMiddleware);

// Generate daily summary
router.post('/summary/daily', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.auroraContext!;
    const summary = await auroraService.generateDailySummary(organizationId);

    res.json({ summary });
  } catch (error: any) {
    logger.error('Generate summary error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get analytics insights
router.get('/analytics', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.auroraContext!;
    const summary = await auroraService.generateDailySummary(organizationId);

    res.json({ summary });
  } catch (error: any) {
    logger.error('Get analytics error', error);
    res.status(500).json({ error: error.message });
  }
});

// Suggest campaigns
router.post('/campaigns/suggest', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId, phoneNumber, ownerName } = req.auroraContext!;

    const response = await auroraService.processOwnerMessage(
      {
        organizationId,
        ownerPhone: phoneNumber,
        ownerName: ownerName || 'Proprietário'
      },
      'Sugira campanhas de marketing para aumentar o faturamento'
    );

    res.json({ suggestions: response });
  } catch (error: any) {
    logger.error('Suggest campaigns error', error);
    res.status(500).json({ error: error.message });
  }
});

// Identify opportunities
router.get('/opportunities', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId, phoneNumber, ownerName } = req.auroraContext!;

    const response = await auroraService.processOwnerMessage(
      {
        organizationId,
        ownerPhone: phoneNumber,
        ownerName: ownerName || 'Proprietário'
      },
      'Identifique oportunidades de crescimento e aumento de faturamento'
    );

    res.json({ opportunities: response });
  } catch (error: any) {
    logger.error('Identify opportunities error', error);
    res.status(500).json({ error: error.message });
  }
});

// Process owner message (from WhatsApp)
router.post('/message', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId, phoneNumber, organizationName } = req.auroraContext!;
    const { message, ownerName } = req.body;

    const response = await auroraService.processOwnerMessage(
      {
        organizationId,
        ownerPhone: phoneNumber,
        ownerName: ownerName || organizationName || 'Proprietário'
      },
      message
    );

    res.json({ response });
  } catch (error: any) {
    logger.error('Process owner message error', error);
    res.status(500).json({ error: error.message });
  }
});

// Proactive messages endpoints

// Analyze and generate proactive notifications
router.post('/proactive/analyze', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.auroraContext!;

    const messages = await auroraProactiveService.analyzeAndNotify(organizationId);

    res.json({
      count: messages.length,
      messages: messages.map(m => ({
        type: m.type,
        priority: m.priority,
        preview: m.message.substring(0, 100) + '...'
      }))
    });
  } catch (error: any) {
    logger.error('Analyze proactive messages error', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate weekly report
router.post('/proactive/weekly-report', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.auroraContext!;

    const report = await auroraProactiveService.generateWeeklyReport(organizationId);

    if (!report) {
      res.status(404).json({ error: 'Unable to generate report' });
      return;
    }

    res.json({ report: report.message });
  } catch (error: any) {
    logger.error('Generate weekly report error', error);
    res.status(500).json({ error: error.message });
  }
});

// Send proactive message
router.post('/proactive/send', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId, phoneNumber } = req.auroraContext!;
    const { type, message, priority } = req.body;

    const sent = await auroraProactiveService.sendProactiveMessage({
      type,
      organizationId,
      ownerPhone: phoneNumber,
      message,
      priority: priority || 'medium'
    });

    res.json({ sent, message: sent ? 'Message queued for delivery' : 'Failed to queue message' });
  } catch (error: any) {
    logger.error('Send proactive message error', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual daily summary (send immediately via WhatsApp)
router.post('/automation/trigger-daily-summary', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.auroraContext!;

    const { triggerDailySummary } = await import('../queue/jobs/aurora-daily-summary.job.js');
    await triggerDailySummary(organizationId);

    res.json({
      success: true,
      message: 'Daily summary queued for delivery via WhatsApp'
    });
  } catch (error: any) {
    logger.error('Trigger daily summary error', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger manual opportunities report (send immediately via WhatsApp)
router.post('/automation/trigger-opportunities', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.auroraContext!;

    const { triggerOpportunities } = await import('../queue/jobs/aurora-opportunities.job.js');
    await triggerOpportunities(organizationId);

    res.json({
      success: true,
      message: 'Opportunities report queued for delivery via WhatsApp'
    });
  } catch (error: any) {
    logger.error('Trigger opportunities error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
