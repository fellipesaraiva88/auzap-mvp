import { Router } from 'express';
import { BookingsService } from '../services/bookings.service';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/bookings
 * Criar novo agendamento
 */
router.post('/', async (req, res) => {
  try {
    const {
      organization_id,
      contact_id,
      pet_id,
      service_id,
      scheduled_date,
      duration_minutes,
      notes,
    } = req.body;

    if (!organization_id || !contact_id || !pet_id || !service_id || !scheduled_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const booking = await BookingsService.createBooking({
      organization_id,
      contact_id,
      pet_id,
      service_id,
      scheduled_date,
      duration_minutes,
      notes,
    });

    res.json(booking);
  } catch (error: any) {
    logger.error({ error }, 'Error in POST /api/bookings');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bookings/:id
 * Buscar agendamento por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const booking = await BookingsService.getBookingById(organization_id as string, id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/bookings/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bookings
 * Listar agendamentos
 */
router.get('/', async (req, res) => {
  try {
    const {
      organization_id,
      status,
      pet_id,
      contact_id,
      date_from,
      date_to,
      limit,
      offset,
    } = req.query;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const result = await BookingsService.listBookings(organization_id as string, {
      status: status as string,
      pet_id: pet_id as string,
      contact_id: contact_id as string,
      date_from: date_from as string,
      date_to: date_to as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/bookings');
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/bookings/:id
 * Atualizar agendamento
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, ...updates } = req.body;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const booking = await BookingsService.updateBooking(organization_id, id, updates);
    res.json(booking);
  } catch (error: any) {
    logger.error({ error }, 'Error in PUT /api/bookings/:id');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bookings/:id/cancel
 * Cancelar agendamento
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id, reason } = req.body;

    if (!organization_id) {
      return res.status(400).json({ error: 'organization_id required' });
    }

    const booking = await BookingsService.cancelBooking(organization_id, id, reason);
    res.json(booking);
  } catch (error: any) {
    logger.error({ error }, 'Error in POST /api/bookings/:id/cancel');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bookings/availability/slots
 * Buscar horários disponíveis
 */
router.get('/availability/slots', async (req, res) => {
  try {
    const { organization_id, date, duration } = req.query;

    if (!organization_id || !date) {
      return res.status(400).json({ error: 'organization_id and date required' });
    }

    const slots = await BookingsService.getAvailableSlots(
      organization_id as string,
      date as string,
      duration ? parseInt(duration as string) : 60
    );

    res.json(slots);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/bookings/availability/slots');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bookings/analytics/summary
 * Analytics de agendamentos
 */
router.get('/analytics/summary', async (req, res) => {
  try {
    const { organization_id, date_from, date_to } = req.query;

    if (!organization_id || !date_from || !date_to) {
      return res.status(400).json({ error: 'organization_id, date_from and date_to required' });
    }

    const analytics = await BookingsService.getBookingAnalytics(
      organization_id as string,
      date_from as string,
      date_to as string
    );

    res.json(analytics);
  } catch (error: any) {
    logger.error({ error }, 'Error in GET /api/bookings/analytics/summary');
    res.status(500).json({ error: error.message });
  }
});

export default router;
