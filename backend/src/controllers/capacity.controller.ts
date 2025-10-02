import { Request, Response } from 'express';
import { TenantAwareSupabase } from '../utils/tenant.utils';

interface Service {
  id: string;
  name: string;
  total_capacity: number;
  color: string;
}

export class CapacityController {
  /**
   * Get capacity metrics for all services
   */
  async getCapacityMetrics(req: Request, res: Response) {
    try {
      const organizationId = (req as { organizationId?: string })
        .organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const supabase = TenantAwareSupabase.getClient();

      // Get all services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name, total_capacity, color');

      if (servicesError) throw servicesError;

      // Get today's bookings for each service
      const today = new Date().toISOString().split('T')[0];
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('service_id, status')
        .eq('booking_date', today)
        .in('status', ['confirmed', 'in_progress']);

      if (bookingsError) throw bookingsError;

      // Calculate metrics for each service
      const serviceMetrics = (services || []).map((service: Service) => {
        const serviceBookings = (bookings || []).filter(
          (b) => b.service_id === service.id
        );
        const occupied = serviceBookings.length;
        const total = service.total_capacity || 10;
        const percentage = Math.round((occupied / total) * 100);

        // Mock daily revenue - will be calculated from actual booking prices
        const dailyRevenue = occupied * 120; // R$120 média por serviço

        return {
          id: service.id,
          name: service.name,
          percentage,
          occupied,
          total,
          dailyRevenue,
          color: service.color || '#3b82f6',
          waitingList: percentage === 100,
        };
      });

      // Calculate summary
      const totalOccupied = serviceMetrics.reduce(
        (sum, s) => sum + s.occupied,
        0
      );
      const totalRevenue = serviceMetrics.reduce(
        (sum, s) => sum + s.dailyRevenue,
        0
      );
      const averageOccupancy = Math.round(
        serviceMetrics.reduce((sum, s) => sum + s.percentage, 0) /
          serviceMetrics.length
      );
      const servicesAtCapacity = serviceMetrics.filter(
        (s) => s.percentage === 100
      ).length;

      res.json({
        services: serviceMetrics,
        summary: {
          totalOccupied,
          totalRevenue,
          averageOccupancy,
          servicesAtCapacity,
        },
      });
    } catch (error) {
      console.error('Error fetching capacity metrics:', error);
      res.status(500).json({ error: 'Failed to fetch capacity metrics' });
    }
  }

  /**
   * Get schedule for a specific service
   */
  async getServiceSchedule(req: Request, res: Response) {
    try {
      const { serviceId } = req.params;
      const { date } = req.query;
      const organizationId = (req as { organizationId?: string })
        .organizationId;

      if (!organizationId || !serviceId || !date) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const supabase = TenantAwareSupabase.getClient();

      // Get service details
      const { data: service } = await supabase
        .from('services')
        .select('total_capacity')
        .eq('id', serviceId)
        .single();

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // Get bookings for this service on this date
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, pet_id, booking_time, pets(name)')
        .eq('service_id', serviceId)
        .eq('booking_date', date as string)
        .in('status', ['confirmed', 'in_progress']);

      // Generate time slots (8h - 18h, every hour)
      const slots = [];
      for (let hour = 8; hour < 18; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const booking = (bookings || []).find((b) =>
          b.booking_time?.startsWith(time.split(':')[0])
        );

        slots.push({
          time,
          available: !booking,
          petId: booking?.pet_id,
          petName: booking?.pets?.name,
        });
      }

      res.json({ slots });
    } catch (error) {
      console.error('Error fetching service schedule:', error);
      res.status(500).json({ error: 'Failed to fetch service schedule' });
    }
  }

  /**
   * Book a slot for a service
   */
  async bookSlot(req: Request, res: Response) {
    try {
      const { serviceId } = req.params;
      const { petId, date, time } = req.body;
      const organizationId = (req as { organizationId?: string })
        .organizationId;

      if (!organizationId || !serviceId || !petId || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const supabase = TenantAwareSupabase.getClient();

      // Check if slot is available
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('service_id', serviceId)
        .eq('booking_date', date)
        .eq('booking_time', time)
        .in('status', ['confirmed', 'in_progress'])
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Slot already booked' });
      }

      // Create booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          service_id: serviceId,
          pet_id: petId,
          booking_date: date,
          booking_time: time,
          status: 'confirmed',
        })
        .select()
        .single();

      if (error) throw error;

      res.json({ booking });
    } catch (error) {
      console.error('Error booking slot:', error);
      res.status(500).json({ error: 'Failed to book slot' });
    }
  }
}
