import { Router } from 'express';
import { ContactsService } from '../services/contacts.service';
import { PetsService } from '../services/pets.service';
import { logger } from '../config/logger';

const router = Router();

// ========== CONTACTS ==========

/**
 * POST /api/contacts
 * Criar novo contato
 */
router.post('/', async (req, res) => {
  try {
    const { organization_id, phone, name, email, notes } = req.body;

    if (!organization_id || !phone) {
      return res.status(400).json({ error: 'organization_id and phone required' });
    }

    const contact = await ContactsService.createContact({
      organization_id,
      phone,
      name,
      email,
      notes,
    });

    res.json(contact);
  } catch (error: any) {
    logger.error({ error }, 'Error in POST /api/contacts');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/contacts/:id
 * Buscar contato por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const contact = await ContactsService.getContactById(organization_id as string, id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/contacts/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/contacts
 * Listar contatos
 */
router.get('/', async (req, res) => {
  try {
    const { organization_id, status, search, limit, offset } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const result = await ContactsService.listContacts(organization_id as string, {
      status: status as string,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/contacts');
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/contacts/:id
 * Atualizar contato
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, ...updates } = req.body;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const contact = await ContactsService.updateContact(organization_id, id, updates);
    res.json(contact);
  } catch (error: any) {
    logger.error({ error }, 'Error in PUT /api/contacts/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/contacts/:id
 * Deletar contato
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const result = await ContactsService.deleteContact(organization_id as string, id);
    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error in DELETE /api/contacts/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/contacts/inactive
 * Buscar contatos inativos
 */
router.get('/analytics/inactive', async (req, res) => {
  try {
    const { organization_id, days } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const contacts = await ContactsService.getInactiveContacts(
      organization_id as string,
      days ? parseInt(days as string) : 60
    );

    res.json(contacts);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/contacts/analytics/inactive');
    res.status(500).json({ error: error.message });
  }
});

// ========== PETS ==========

/**
 * POST /api/contacts/:contactId/pets
 * Criar pet para um contato
 */
router.post('/:contactId/pets', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { organization_id, name, species, breed, age, weight, color, notes, medical_conditions } = req.body;

    if (!organization_id || !name) {
      return res.status(400).json({ error: 'organization_id and name required' });
    }

    const pet = await PetsService.createPet({
      organization_id,
      contact_id: contactId,
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
    logger.error({ error }, 'Error in POST /api/contacts/:contactId/pets');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/contacts/:contactId/pets
 * Listar pets de um contato
 */
router.get('/:contactId/pets', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { organization_id } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const pets = await PetsService.getPetsByContact(organization_id as string, contactId);
    res.json(pets);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/contacts/:contactId/pets');
    res.status(500).json({ error: error.message });
  }
});

export default router;
