import { Router, Response } from 'express';
import { PetsService } from '../services/pets/pets.service.js';
import { logger } from '../config/logger.js';
import { TenantRequest, tenantMiddleware, validateResource } from '../middleware/tenant.middleware.js';
import { standardLimiter } from '../middleware/rate-limiter.js';

const router = Router();
const petsService = new PetsService();

// Apply tenant middleware and rate limiting to all routes
router.use(tenantMiddleware);
router.use(standardLimiter);

// List pets by contact (with organization validation)
router.get('/contact/:contactId', validateResource('contactId', 'contacts'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { contactId } = req.params;
    const pets = await petsService.listByContact(contactId);

    res.json({ pets });
  } catch (error: any) {
    logger.error('List pets error', error);
    res.status(500).json({ error: error.message });
  }
});

// List pets by organization
router.get('/organization', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { search, species } = req.query;

    const pets = await petsService.listByOrganization(organizationId, {
      searchQuery: search as string,
      species: species as any
    });

    res.json({ pets });
  } catch (error: any) {
    logger.error('List organization pets error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pet by ID (with organization validation)
router.get('/:id', validateResource('id', 'pets'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pet = await petsService.findById(id);

    if (!pet) {
      res.status(404).json({ error: 'Pet not found' });
      return;
    }

    res.json({ pet });
  } catch (error: any) {
    logger.error('Get pet error', error);
    res.status(500).json({ error: error.message });
  }
});

// Create pet
router.post('/', async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const petData = { ...req.body, organization_id: organizationId };

    const pet = await petsService.create(petData);
    res.status(201).json({ pet });
  } catch (error: any) {
    logger.error('Create pet error', error);
    res.status(500).json({ error: error.message });
  }
});

// Update pet (with organization validation)
router.patch('/:id', validateResource('id', 'pets'), async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pet = await petsService.update(id, req.body);

    res.json({ pet });
  } catch (error: any) {
    logger.error('Update pet error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
