import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';

const router = Router();

// Get follow-ups by status
router.get('/', async (req, res): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const status = req.query.status as string;

    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID required' });
      return;
    }

    let query = supabaseAdmin
      .from('scheduled_followups')
      .select(`
        id,
        contact_id,
        scheduled_for,
        message_template,
        status,
        created_at,
        sent_at,
        contacts (
          id,
          name,
          phone,
          pets (
            id,
            name
          )
        )
      `)
      .eq('organization_id', organizationId)
      .order('scheduled_for', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: followups, error } = await query;

    if (error) throw error;

    res.json({
      followups: followups || [],
      count: followups?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Get follow-ups error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get follow-up details
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;

    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID required' });
      return;
    }

    const { data: followup, error } = await supabaseAdmin
      .from('scheduled_followups')
      .select(`
        *,
        contacts (
          id,
          name,
          phone,
          pets (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;

    res.json({ followup });
  } catch (error: any) {
    logger.error('Get follow-up details error', error);
    res.status(500).json({ error: error.message });
  }
});

// Create follow-up
router.post('/', async (req, res): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { contact_id, scheduled_for, message } = req.body;

    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID required' });
      return;
    }

    const { data: followup, error } = await supabaseAdmin
      .from('scheduled_followups')
      .insert({
        contact_id,
        scheduled_for,
        message_template: message,
        status: 'pending',
        organization_id: organizationId
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ followup });
  } catch (error: any) {
    logger.error('Create follow-up error', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel follow-up
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { id } = req.params;

    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID required' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('scheduled_followups')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Cancel follow-up error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
