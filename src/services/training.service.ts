import { api } from './api';

export const trainingService = {
  async list(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get('/training/plans', { params: filters });
    return response.data;
  },

  async getById(planId: string) {
    const response = await api.get(`/training/plans/${planId}`);
    return response.data;
  },

  async create(data: {
    pet_id: string;
    contact_id: string;
    initial_assessment: any;
    plan_type: '1x_semana' | '2x_semana' | '3x_semana';
    start_date: string;
    goals?: string[];
    notes?: string;
  }) {
    const response = await api.post('/training/plans', data);
    return response.data;
  },

  async update(planId: string, updates: {
    status?: 'active' | 'completed' | 'cancelled';
    progress?: any;
    notes?: string;
  }) {
    const response = await api.put(`/training/plans/${planId}`, updates);
    return response.data;
  },

  async recordProgress(planId: string, progressData: {
    session_number: number;
    date: string;
    achievements: string[];
    challenges: string[];
    trainer_notes: string;
  }) {
    const response = await api.post(`/training/plans/${planId}/progress`, progressData);
    return response.data;
  }
};
