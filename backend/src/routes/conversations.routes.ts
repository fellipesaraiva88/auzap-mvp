import { Router } from 'express';
import { ConversationsService } from '../services/conversations.service';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/conversations
 * Listar conversas da organização
 */
router.get('/', async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const { status, limit = 50, offset = 0 } = req.query;

    const result = await ConversationsService.listConversations(organizationId, {
      status: status as any,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error listing conversations');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conversations/:id
 * Buscar conversa específica
 */
router.get('/:id', async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const conversation = await ConversationsService.getConversationById(organizationId, id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error: any) {
    logger.error({ error }, 'Error getting conversation');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conversations/:id/messages
 * Listar mensagens de uma conversa
 */
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await ConversationsService.getConversationMessages(id, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error getting conversation messages');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversations/:id/read
 * Marcar conversa como lida
 */
router.post('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await ConversationsService.markAsRead(id);

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error marking conversation as read');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversations/:id/close
 * Fechar conversa
 */
router.post('/:id/close', async (req, res) => {
  try {
    const { id } = req.params;

    await ConversationsService.closeConversation(id);

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error closing conversation');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversations/:id/archive
 * Arquivar conversa
 */
router.post('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;

    await ConversationsService.archiveConversation(id);

    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, 'Error archiving conversation');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversations/:id/messages
 * Enviar mensagem em uma conversa
 */
router.post('/:id/messages', async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;
    const { content, content_type = 'text' } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    const message = await ConversationsService.saveOutgoingMessage(organizationId, id, {
      content,
      content_type,
      sent_by_ai: false,
    });

    res.json(message);
  } catch (error: any) {
    logger.error({ error }, 'Error sending message');
    res.status(500).json({ error: error.message });
  }
});

export default router;
