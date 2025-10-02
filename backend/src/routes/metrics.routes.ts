import { Router } from 'express';
import { MetricsController } from '../controllers/metrics.controller';

const router = Router();
const metricsController = new MetricsController();

/**
 * @route GET /api/metrics/dashboard
 * @desc Get dashboard metrics (impact, revenue, capacity)
 * @access Private (tenant-aware)
 */
router.get('/dashboard', metricsController.getDashboardMetrics);

/**
 * @route GET /api/metrics/realtime
 * @desc Get real-time metrics (active conversations, pending messages)
 * @access Private (tenant-aware)
 */
router.get('/realtime', metricsController.getRealtimeMetrics);

/**
 * @route GET /api/metrics/conversations
 * @desc Get conversation metrics over time
 * @access Private (tenant-aware)
 */
router.get('/conversations', metricsController.getConversationMetrics);

/**
 * @route GET /api/metrics/ai-performance
 * @desc Get AI performance metrics (resolution rate, response time)
 * @access Private (tenant-aware)
 */
router.get('/ai-performance', metricsController.getAIPerformanceMetrics);

export default router;
