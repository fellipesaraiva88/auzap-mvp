import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';

const router = Router();

// Apply tenant middleware and rate limiting to all routes
router.use(tenantMiddleware);
router.use(standardLimiter);

// Get organization settings (including AI personality)
router.get('/:organizationId', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const authenticatedOrgId = req.organizationId!;

    // Verify user has access to this organization
    if (organizationId !== authenticatedOrgId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const { data: settings, error } = await supabaseAdmin
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return default settings if none exist
    if (!settings) {
      res.json({
        settings: {
          ai_personality: 'professional',
          ai_name: 'Aurora',
          ai_tone: 'friendly',
          auto_respond: true,
          escalation_keywords: ['emergência', 'urgente', 'proprietário'],
          business_hours_start: '08:00',
          business_hours_end: '18:00',
          business_days: [1, 2, 3, 4, 5] // Mon-Fri
        }
      });
      return;
    }

    res.json({ settings });
  } catch (error: any) {
    logger.error('Get settings error', error);
    res.status(500).json({ error: error.message });
  }
});

// Update organization settings
router.patch('/:organizationId', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const authenticatedOrgId = req.organizationId!;

    if (organizationId !== authenticatedOrgId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updates = req.body;

    // Check if settings exist
    const { data: existing } = await supabaseAdmin
      .from('organization_settings')
      .select('id')
      .eq('organization_id', organizationId)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .update(updates)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await supabaseAdmin
        .from('organization_settings')
        .insert({
          organization_id: organizationId,
          ...updates
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({ settings: result });
  } catch (error: any) {
    logger.error('Update settings error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
