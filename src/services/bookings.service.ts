import { apiClient } from '@/lib/api';

export interface Booking {
  id: string;
  organization_id: string;
  contact_id: string;
  pet_id?: string;
  service_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  reminder_sent: boolean;
  created_by_ai: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
  contact_id: string;
  pet_id?: string;
  service_id: string;
  scheduled_start: string;
  scheduled_end: string;
  notes?: string;
}

export interface UpdateBookingData {
  scheduled_start?: string;
  scheduled_end?: string;
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  actual_start?: string;
  actual_end?: string;
}

class BookingsService {
  async list(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    contactId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ bookings: Booking[]; total: number }> {
    const response = await apiClient.get<{ bookings: Booking[]; total: number }>('/api/bookings', { params });
    return response.data;
  }

  async getById(bookingId: string): Promise<Booking> {
    const response = await apiClient.get<{ booking: Booking }>(`/api/bookings/${bookingId}`);
    return response.data.booking;
  }

  async create(data: CreateBookingData): Promise<Booking> {
    const response = await apiClient.post<{ booking: Booking }>('/api/bookings', data);
    return response.data.booking;
  }

  async update(bookingId: string, data: UpdateBookingData): Promise<Booking> {
    const response = await apiClient.patch<{ booking: Booking }>(`/api/bookings/${bookingId}`, data);
    return response.data.booking;
  }

  async delete(bookingId: string): Promise<void> {
    await apiClient.delete(`/api/bookings/${bookingId}`);
  }

  async confirm(bookingId: string): Promise<Booking> {
    const response = await apiClient.post<{ booking: Booking }>(`/api/bookings/${bookingId}/confirm`);
    return response.data.booking;
  }

  async cancel(bookingId: string, reason?: string): Promise<Booking> {
    const response = await apiClient.post<{ booking: Booking }>(`/api/bookings/${bookingId}/cancel`, { reason });
    return response.data.booking;
  }

  async start(bookingId: string): Promise<Booking> {
    const response = await apiClient.post<{ booking: Booking }>(`/api/bookings/${bookingId}/start`);
    return response.data.booking;
  }

  async complete(bookingId: string): Promise<Booking> {
    const response = await apiClient.post<{ booking: Booking }>(`/api/bookings/${bookingId}/complete`);
    return response.data.booking;
  }

  async sendReminder(bookingId: string): Promise<void> {
    await apiClient.post(`/api/bookings/${bookingId}/reminder`);
  }
}

export const bookingsService = new BookingsService();
