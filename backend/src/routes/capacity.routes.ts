import { Router } from 'express';
import { CapacityController } from '../controllers/capacity.controller';

const router = Router();
const capacityController = new CapacityController();

/**
 * @route GET /api/capacity
 * @desc Get all services capacity metrics
 * @access Private (tenant-aware)
 */
router.get('/', capacityController.getCapacityMetrics);

/**
 * @route GET /api/capacity/:serviceId/schedule
 * @desc Get schedule for a specific service on a date
 * @access Private (tenant-aware)
 */
router.get('/:serviceId/schedule', capacityController.getServiceSchedule);

/**
 * @route POST /api/capacity/:serviceId/book
 * @desc Book a slot for a service
 * @access Private (tenant-aware)
 */
router.post('/:serviceId/book', capacityController.bookSlot);

export default router;
