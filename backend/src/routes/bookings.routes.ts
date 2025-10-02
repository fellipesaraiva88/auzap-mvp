import { Router } from 'express';
import { BookingsService } from '../services/bookings/bookings.service.js';
import { logger } from '../config/logger.js';

const router = Router();
const bookingsService = new BookingsService();

// List bookings by organization
router.get('/', async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { startDate, endDate, status, contactId, petId } = req.query;

    const bookings = await bookingsService.listByOrganization(organizationId, {
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as any,
      contactId: contactId as string,
      petId: petId as string
    });

    res.json({ bookings });
  } catch (error: any) {
    logger.error('List bookings error', error);
    res.status(500).json({ error: error.message });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingsService.findById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error: any) {
    logger.error('Get booking error', error);
    res.status(500).json({ error: error.message });
  }
});

// Check availability
router.post('/check-availability', async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { start, end, excludeBookingId } = req.body;

    const available = await bookingsService.checkAvailability(
      organizationId,
      start,
      end,
      excludeBookingId
    );

    res.json({ available });
  } catch (error: any) {
    logger.error('Check availability error', error);
    res.status(500).json({ error: error.message });
  }
});

// Create booking
router.post('/', async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const bookingData = { ...req.body, organization_id: organizationId };

    const booking = await bookingsService.create(bookingData);
    res.status(201).json({ booking });
  } catch (error: any) {
    logger.error('Create booking error', error);
    res.status(500).json({ error: error.message });
  }
});

// Update booking
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingsService.update(id, req.body);

    res.json({ booking });
  } catch (error: any) {
    logger.error('Update booking error', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel booking
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await bookingsService.cancel(id, reason);
    res.json({ booking });
  } catch (error: any) {
    logger.error('Cancel booking error', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
