import { Router, type Response } from 'express';
import { tenantMiddleware, TenantRequest } from '../middleware/tenant.middleware.js';
import { clientAIService } from '../services/ai/client-ai.service.js';
import { logger } from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Todas as rotas requerem tenant middleware
router.use(tenantMiddleware);

/**
 * POST /api/v1/ai/playground
 * Simula processamento de mensagem pela Client AI
 *
 * Body: { message, conversationHistory? }
 */
router.post('/playground', async (req: TenantRequest, res: Response) => {
  try {
    const organizationId = req.organizationId!;
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required',
        code: 'MISSING_MESSAGE'
      });
    }

    logger.info('🎮 AI Playground: Processing message', {
      organizationId,
      messageLength: message.length,
      historyLength: conversationHistory.length
    });

    // Simular contexto de conversa do playground
    const playgroundConversationId = `playground_${uuidv4()}`;
    const playgroundContactPhone = '5511999999999'; // Número fictício

    // Processar mensagem usando o Client AI Service
    const response = await clientAIService.processMessage({
      organizationId,
      conversationId: playgroundConversationId,
      from: playgroundContactPhone,
      content: message,
      timestamp: new Date(),
      isPlayground: true, // Flag para indicar que é do playground
      conversationHistory: conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    });

    logger.info('✅ AI Playground: Response generated', {
      organizationId,
      responseLength: response.length
    });

    return res.status(200).json({
      response,
      metadata: {
        conversationId: playgroundConversationId,
        timestamp: new Date().toISOString(),
        mode: 'playground'
      }
    });

  } catch (error) {
    logger.error('❌ AI Playground: Error processing message', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return res.status(500).json({
      error: 'Failed to process message',
      code: 'PROCESSING_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
