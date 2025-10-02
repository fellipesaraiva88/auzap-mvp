import { Router } from 'express';
import { PetsService } from '../services/pets.service';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/pets
 * Criar novo pet
 */
router.post('/', async (req, res) => {
  try {
    const {
      organization_id,
      contact_id,
      name,
      species,
      breed,
      age,
      weight,
      color,
      notes,
      medical_conditions,
    } = req.body;

    if (!organization_id || !contact_id || !name) {
      return res.status(400).json({ error: 'organization_id, contact_id and name required' });
    }

    const pet = await PetsService.createPet({
      organization_id,
      contact_id,
      name,
      species,
      breed,
      age,
      weight,
      color,
      notes,
      medical_conditions,
    });

    res.json(pet);
  } catch (error: any) {
    logger.error({ error }, 'Error in POST /api/pets');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pets/:id
 * Buscar pet por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const pet = await PetsService.getPetById(organization_id as string, id);

    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(pet);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/pets/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pets
 * Listar pets
 */
router.get('/', async (req, res) => {
  try {
    const { organization_id, species, search, limit, offset } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const result = await PetsService.listPets(organization_id as string, {
      species: species as string,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/pets');
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/pets/:id
 * Atualizar pet
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, ...updates } = req.body;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const pet = await PetsService.updatePet(organization_id, id, updates);
    res.json(pet);
  } catch (error: any) {
    logger.error({ error }, 'Error in PUT /api/pets/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/pets/:id
 * Deletar pet (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const result = await PetsService.deletePet(organization_id as string, id);
    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error in DELETE /api/pets/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pets/analytics/needing-service
 * Buscar pets que precisam de serviço
 */
router.get('/analytics/needing-service', async (req, res) => {
  try {
    const { organization_id, service_type, days } = req.query;

    if (!organization_id || !service_type) {
      return res.status(400).json({ error: 'organization_id and service_type required' });
    }

    const pets = await PetsService.getPetsNeedingService(
      organization_id as string,
      service_type as string,
      days ? parseInt(days as string) : 30
    );

    res.json(pets);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/pets/analytics/needing-service');
    res.status(500).json({ error: error.message });
  }
});

export default router;
