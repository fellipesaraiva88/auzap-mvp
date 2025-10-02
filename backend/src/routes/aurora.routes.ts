import { Router, Request, Response } from 'express';
import { AuroraService } from '../services/aurora/aurora.service.js';
import { logger } from '../config/logger.js';

const router = Router();
const auroraService = new AuroraService();

// Generate daily summary
router.post('/summary/daily', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const summary = await auroraService.generateDailySummary(organizationId);

    res.json({ summary });
  } catch (error: any) {
    logger.error('Generate summary error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get analytics insights
router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const summary = await auroraService.generateDailySummary(organizationId);

    res.json({ summary });
  } catch (error: any) {
    logger.error('Get analytics error', error);
    res.status(500).json({ error: error.message });
  }
});

// Suggest campaigns
router.post('/campaigns/suggest', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { phoneNumber, ownerName } = req.body;

    const response = await auroraService.processOwnerMessage(
      {
        organizationId,
        ownerPhone: phoneNumber || '5511999999999',
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
router.get('/opportunities', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { phoneNumber, ownerName } = req.query;

    const response = await auroraService.processOwnerMessage(
      {
        organizationId,
        ownerPhone: phoneNumber as string || '5511999999999',
        ownerName: ownerName as string || 'Proprietário'
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
router.post('/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { phoneNumber, message, ownerName } = req.body;

    const response = await auroraService.processOwnerMessage(
      {
        organizationId,
        ownerPhone: phoneNumber,
        ownerName: ownerName || 'Proprietário'
      },
      message
    );

    res.json({ response });
  } catch (error: any) {
    logger.error('Process owner message error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
