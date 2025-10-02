import { Router } from 'express';
import { AuroraService } from '../services/aurora/aurora.service.js';
import { logger } from '../config/logger.js';

const router = Router();
const auroraService = new AuroraService();

// Generate daily summary
router.post('/summary/daily', async (req, res) => {
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
router.get('/analytics', async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { startDate, endDate } = req.query;

    const insights = await auroraService.getAnalyticsInsights(
      organizationId,
      startDate as string,
      endDate as string
    );

    res.json({ insights });
  } catch (error: any) {
    logger.error('Get analytics error', error);
    res.status(500).json({ error: error.message });
  }
});

// Suggest campaigns
router.post('/campaigns/suggest', async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const suggestions = await auroraService.suggestCampaigns(organizationId);

    res.json({ suggestions });
  } catch (error: any) {
    logger.error('Suggest campaigns error', error);
    res.status(500).json({ error: error.message });
  }
});

// Identify opportunities
router.get('/opportunities', async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const opportunities = await auroraService.identifyOpportunities(organizationId);

    res.json({ opportunities });
  } catch (error: any) {
    logger.error('Identify opportunities error', error);
    res.status(500).json({ error: error.message });
  }
});

// Process owner message (from WhatsApp)
router.post('/message', async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { phoneNumber, message } = req.body;

    const response = await auroraService.processOwnerMessage(
      organizationId,
      phoneNumber,
      message
    );

    res.json({ response });
  } catch (error: any) {
    logger.error('Process owner message error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
