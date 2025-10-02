import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

/**
 * GET /api/conversations
 * Lista conversas com filtros opcionais
 * Query params:
 * - status: active | escalated | resolved
 * - assignee: user_id
 * - search: busca em nome do contato
 * - page: número da página (default: 1)
 * - limit: itens por página (default: 20)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID required' });
      return;
    }

    const {
      status,
      assignee,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Query base com JOIN para pegar dados do contato
    let query = supabaseAdmin
      .from('conversations')
      .select(`
        *,
        contacts (
          id,
          phone_number,
          full_name,
          email,
          pets (id, name, species, breed)
        )
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Filtros opcionais
    if (status) {
      query = query.eq('status', status);
    }

    // TODO: Implementar filtro por assignee quando tiver campo assigned_to

    // Search: busca no nome do contato via JOIN
    if (search) {
      // Nota: Supabase não suporta ILIKE em JOINs diretos
      // Vamos fazer busca client-side ou usar RPC function
      const { data: allConversations } = await query;
      const filtered = allConversations?.filter(conv =>
        conv.contacts?.full_name?.toLowerCase().includes((search as string).toLowerCase())
      );

      res.json({
        conversations: filtered || [],
        count: filtered?.length || 0,
        page: pageNum,
        totalPages: Math.ceil((filtered?.length || 0) / limitNum)
      });
      return;
    }

    const { data: conversations, count, error } = await query;

    if (error) throw error;

    res.json({
      conversations: conversations || [],
      count: count || 0,
      page: pageNum,
      totalPages: Math.ceil((count || 0) / limitNum)
    });

  } catch (error: any) {
    console.error('Error listing conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conversations/:id/messages
 * Retorna todas as mensagens de uma conversa
 * Query params:
 * - limit: número de mensagens (default: 100)
 */
router.get('/:id/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;
    const { limit = '100' } = req.query;

    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID required' });
      return;
    }

    // Verificar se a conversa pertence à organização
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, organization_id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (convError || !conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Buscar mensagens
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
      .limit(parseInt(limit as string));

    if (error) throw error;

    res.json({
      conversationId: id,
      messages: messages || [],
      count: messages?.length || 0
    });

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conversations/:id/ai-actions
 * Retorna histórico de ações da IA nessa conversa
 * Inclui: cadastro de pet, agendamento, venda, escalação
 */
router.get('/:id/ai-actions', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;

    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID required' });
      return;
    }

    // Verificar se a conversa pertence à organização
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, organization_id, contact_id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (convError || !conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Buscar interações da IA
    const { data: interactions, error } = await supabaseAdmin
      .from('ai_interactions')
      .select('*')
      .eq('conversation_id', id)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      conversationId: id,
      contactId: conversation.contact_id,
      actions: interactions || [],
      count: interactions?.length || 0
    });

  } catch (error: any) {
    console.error('Error fetching AI actions:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
