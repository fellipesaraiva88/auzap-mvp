import { Router, Response } from 'express';
import { z } from 'zod';
import { petHealthService } from '../services/bipe/pet-health.service.js';
import { logger } from '../config/logger.js';
import { readLimiter, criticalLimiter } from '../middleware/rate-limiter.js';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply tenant middleware FIRST (before rate limiting)
router.use(tenantMiddleware);

// GET routes: read limiter (120 req/min)
router.use(['/', '/:petId', '/:petId/history', '/:petId/report'], readLimiter);

// POST/PUT/DELETE routes: critical limiter (100 req/min as specified)
router.use(['/', '/:petId/*'], (req, _res, next) => {
  if (req.method !== 'GET') {
    return criticalLimiter(req, _res, next);
  }
  return next();
});

// ============================================================================
// Validation Schemas
// ============================================================================

const createProtocolSchema = z.object({
  petId: z.string().uuid('Invalid pet ID format'),
  behavioralScore: z.number().int().min(0).max(100).optional(),
  behavioralNotes: z.string().optional(),
  individualNeeds: z.object({
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    specialCare: z.array(z.string()).optional()
  }).optional(),
  preventiveCare: z.object({
    vaccines: z.array(z.object({
      name: z.string(),
      lastDate: z.string().datetime(),
      nextDueDate: z.string().datetime(),
      veterinarian: z.string().optional(),
      notes: z.string().optional()
    })).optional(),
    deworming: z.object({
      lastDate: z.string().datetime(),
      nextDueDate: z.string().datetime(),
      medication: z.string().optional()
    }).optional(),
    exams: z.array(z.object({
      type: z.string(),
      lastDate: z.string().datetime(),
      nextDueDate: z.string().datetime().optional(),
      results: z.string().optional()
    })).optional()
  }).optional()
});

const updateBehavioralSchema = z.object({
  behavioralScore: z.number().int().min(0).max(100),
  behavioralNotes: z.string(),
  assessedBy: z.string().optional(),
  assessmentDate: z.string().datetime().optional()
});

const updateIndividualSchema = z.object({
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  specialCare: z.array(z.string()).optional(),
  notes: z.string().optional()
});

const updatePreventiveSchema = z.object({
  vaccines: z.array(z.object({
    name: z.string(),
    lastDate: z.string().datetime(),
    nextDueDate: z.string().datetime(),
    veterinarian: z.string().optional(),
    notes: z.string().optional()
  })).optional(),
  deworming: z.object({
    lastDate: z.string().datetime(),
    nextDueDate: z.string().datetime(),
    medication: z.string().optional()
  }).optional(),
  exams: z.array(z.object({
    type: z.string(),
    lastDate: z.string().datetime(),
    nextDueDate: z.string().datetime().optional(),
    results: z.string().optional()
  })).optional()
});

const emergentAlertSchema = z.object({
  type: z.enum([
    'vacina_atrasada',
    'vermifugo_atrasado',
    'comportamento_critico',
    'saude_urgente',
    'exame_atrasado',
    'medicacao_urgente'
  ]),
  severity: z.enum(['baixa', 'media', 'alta', 'critica']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  dueDate: z.string().datetime().optional(),
  requiresAction: z.boolean().optional(),
  actionDeadline: z.string().datetime().optional()
});

const assessmentSchema = z.object({
  type: z.enum(['behavioral', 'health', 'routine', 'emergency']),
  scheduledAt: z.string().datetime(),
  veterinarian: z.string().optional(),
  notes: z.string().optional(),
  location: z.string().optional()
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/bipe/protocol
 * Create BIPE protocol for a pet
 */
router.post('/protocol', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;

    // Validate input
    const validationResult = createProtocolSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues
      });
      return;
    }

    const data = validationResult.data;

    // Verify pet belongs to organization
    const { supabaseAdmin } = await import('../config/supabase.js');
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, contact:contacts(organization_id)')
      .eq('id', data.petId)
      .single();

    if (petError || !pet || (pet as any).contact?.organization_id !== organizationId) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    // Create protocol
    const protocol = await petHealthService.createProtocol({
      organizationId,
      petId: data.petId,
      behavioralScore: data.behavioralScore,
      behavioralNotes: data.behavioralNotes,
      individualNeeds: data.individualNeeds,
      preventiveCare: data.preventiveCare
    });

    logger.info({ organizationId, petId: data.petId }, 'BIPE protocol created');
    res.status(201).json({ protocol });
  } catch (error: any) {
    logger.error({ error }, 'Error creating BIPE protocol');
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/bipe/protocol/:petId
 * Get BIPE protocol for a pet
 */
router.get('/protocol/:petId', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { petId } = req.params;

    // Validate UUID format
    if (!z.string().uuid().safeParse(petId).success) {
      res.status(400).json({ error: 'Invalid pet ID format' });
      return;
    }

    // Verify pet belongs to organization
    const { supabaseAdmin } = await import('../config/supabase.js');
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, contact:contacts(organization_id)')
      .eq('id', petId)
      .single();

    if (petError || !pet || (pet as any).contact?.organization_id !== organizationId) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    // Get protocol
    const protocol = await petHealthService.getProtocol(petId);

    if (!protocol) {
      res.status(404).json({ error: 'BIPE protocol not found for this pet' });
      return;
    }

    res.json({ protocol });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching BIPE protocol');
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * PUT /api/bipe/protocol/:petId/behavioral
 * Update behavioral score and notes
 */
router.put('/protocol/:petId/behavioral', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { petId } = req.params;

    // Validate UUID format
    if (!z.string().uuid().safeParse(petId).success) {
      res.status(400).json({ error: 'Invalid pet ID format' });
      return;
    }

    // Validate input
    const validationResult = updateBehavioralSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues
      });
      return;
    }

    const data = validationResult.data;

    // Verify pet belongs to organization
    const { supabaseAdmin } = await import('../config/supabase.js');
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, contact:contacts(organization_id)')
      .eq('id', petId)
      .single();

    if (petError || !pet || (pet as any).contact?.organization_id !== organizationId) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    // Update behavioral data
    const protocol = await petHealthService.updateBehavioralScore(
      petId,
      data.behavioralScore,
      data.behavioralNotes
    );

    logger.info({ organizationId, petId }, 'BIPE behavioral data updated');
    res.json({ protocol });
  } catch (error: any) {
    logger.error({ error }, 'Error updating behavioral data');
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * PUT /api/bipe/protocol/:petId/individual
 * Update individual needs
 */
router.put('/protocol/:petId/individual', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { petId } = req.params;

    // Validate UUID format
    if (!z.string().uuid().safeParse(petId).success) {
      res.status(400).json({ error: 'Invalid pet ID format' });
      return;
    }

    // Validate input
    const validationResult = updateIndividualSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues
      });
      return;
    }

    const data = validationResult.data;

    // Verify pet belongs to organization
    const { supabaseAdmin } = await import('../config/supabase.js');
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, contact:contacts(organization_id)')
      .eq('id', petId)
      .single();

    if (petError || !pet || (pet as any).contact?.organization_id !== organizationId) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    // Update individual needs
    const protocol = await petHealthService.updateIndividualNeeds(petId, data);

    logger.info({ organizationId, petId }, 'BIPE individual needs updated');
    res.json({ protocol });
  } catch (error: any) {
    logger.error({ error }, 'Error updating individual needs');
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * PUT /api/bipe/protocol/:petId/preventive
 * Update preventive care data
 */
router.put('/protocol/:petId/preventive', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { petId } = req.params;

    // Validate UUID format
    if (!z.string().uuid().safeParse(petId).success) {
      res.status(400).json({ error: 'Invalid pet ID format' });
      return;
    }

    // Validate input
    const validationResult = updatePreventiveSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues
      });
      return;
    }

    const data = validationResult.data;

    // Verify pet belongs to organization
    const { supabaseAdmin } = await import('../config/supabase.js');
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, contact:contacts(organization_id)')
      .eq('id', petId)
      .single();

    if (petError || !pet || (pet as any).contact?.organization_id !== organizationId) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    // Update preventive care
    const protocol = await petHealthService.updatePreventiveCare(petId, data);

    logger.info({ organizationId, petId }, 'BIPE preventive care updated');
    res.json({ protocol });
  } catch (error: any) {
    logger.error({ error }, 'Error updating preventive care');
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/bipe/protocol/:petId/alert
 * Add emergent alert
 */
router.post('/protocol/:petId/alert', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { petId } = req.params;

    // Validate UUID format
    if (!z.string().uuid().safeParse(petId).success) {
      res.status(400).json({ error: 'Invalid pet ID format' });
      return;
    }

    // Validate input
    const validationResult = emergentAlertSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues
      });
      return;
    }

    const data = validationResult.data;

    // Verify pet belongs to organization
    const { supabaseAdmin } = await import('../config/supabase.js');
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, contact:contacts(organization_id)')
      .eq('id', petId)
      .single();

    if (petError || !pet || (pet as any).contact?.organization_id !== organizationId) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    // Add alert
    const alert = await petHealthService.addEmergentAlert(petId, {
      type: data.type,
      severity: data.severity,
      title: data.title || 'Alert',
      description: data.description,
      actionRequired: data.actionRequired
    });

    logger.info({ organizationId, petId, alertId: alert.id }, 'BIPE emergent alert added');
    res.status(201).json({ alert });
  } catch (error: any) {
    logger.error({ error }, 'Error adding emergent alert');
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * DELETE /api/bipe/protocol/:petId/alert/:alertId
 * Resolve/delete alert
 */
router.delete('/protocol/:petId/alert/:alertId', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { petId, alertId } = req.params;

    // Validate UUID formats
    if (!z.string().uuid().safeParse(petId).success) {
      res.status(400).json({ error: 'Invalid pet ID format' });
      return;
    }

    // Verify pet belongs to organization
    const { supabaseAdmin } = await import('../config/supabase.js');
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, contact:contacts(organization_id)')
      .eq('id', petId)
      .single();

    if (petError || !pet || (pet as any).contact?.organization_id !== organizationId) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    // Resolve alert
    const resolvedBy = req.userId || 'system';
    const result = await petHealthService.resolveAlert(alertId, petId, organizationId, resolvedBy);

    logger.info({ organizationId, petId, alertId }, 'BIPE alert resolved');
    res.json({ message: 'Alert resolved successfully', alert: result });
  } catch (error: any) {
    logger.error({ error }, 'Error resolving alert');
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/bipe/alerts
 * Get all active alerts for organization
 */
router.get('/alerts', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { severity, type, petId } = req.query;

    const alerts = await petHealthService.getActiveAlerts(organizationId, {
      severity: severity as any,
      type: type as any,
      petId: petId as string
    });

    res.json({ alerts, count: alerts.length });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching active alerts');
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/bipe/protocol/:petId/assessment
 * Schedule assessment
 */
router.post('/protocol/:petId/assessment', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { petId } = req.params;

    // Validate UUID format
    if (!z.string().uuid().safeParse(petId).success) {
      res.status(400).json({ error: 'Invalid pet ID format' });
      return;
    }

    // Validate input
    const validationResult = assessmentSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues
      });
      return;
    }

    const data = validationResult.data;

    // Verify pet belongs to organization
    const { supabaseAdmin } = await import('../config/supabase.js');
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, contact:contacts(organization_id)')
      .eq('id', petId)
      .single();

    if (petError || !pet || (pet as any).contact?.organization_id !== organizationId) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    // Schedule assessment
    const assessment = await petHealthService.scheduleAssessment(petId, organizationId, {
      type: data.type,
      scheduledAt: data.scheduledAt,
      veterinarian: data.veterinarian,
      notes: data.notes,
      location: data.location
    });

    logger.info({ organizationId, petId, assessmentId: assessment.id }, 'BIPE assessment scheduled');
    res.status(201).json({ assessment });
  } catch (error: any) {
    logger.error({ error }, 'Error scheduling assessment');
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/bipe/protocol/:petId/history
 * Get protocol history/timeline
 */
router.get('/protocol/:petId/history', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { petId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    // Validate UUID format
    if (!z.string().uuid().safeParse(petId).success) {
      res.status(400).json({ error: 'Invalid pet ID format' });
      return;
    }

    // Verify pet belongs to organization
    const { supabaseAdmin } = await import('../config/supabase.js');
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, contact:contacts(organization_id)')
      .eq('id', petId)
      .single();

    if (petError || !pet || (pet as any).contact?.organization_id !== organizationId) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    // Get history
    const history = await petHealthService.getProtocolHistory(
      petId,
      organizationId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({ history, count: history.length });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching protocol history');
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/bipe/protocol/:petId/report
 * Generate complete health report
 */
router.get('/protocol/:petId/report', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { petId } = req.params;

    // Validate UUID format
    if (!z.string().uuid().safeParse(petId).success) {
      res.status(400).json({ error: 'Invalid pet ID format' });
      return;
    }

    // Verify pet belongs to organization
    const { supabaseAdmin } = await import('../config/supabase.js');
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, name, species, breed, contact:contacts(organization_id, full_name)')
      .eq('id', petId)
      .single();

    if (petError || !pet || (pet as any).contact?.organization_id !== organizationId) {
      res.status(404).json({ error: 'Pet not found or access denied' });
      return;
    }

    // Generate comprehensive report
    const report = await petHealthService.generateHealthReport(petId, organizationId);

    logger.info({ organizationId, petId }, 'BIPE health report generated');
    res.json({
      report,
      metadata: {
        petName: pet.name,
        species: pet.species,
        breed: pet.breed,
        ownerName: (pet as any).contact?.full_name,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error({ error }, 'Error generating health report');
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
