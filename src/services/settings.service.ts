import { apiClient } from '../lib/api';

export const settingsService = {
  async get() {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  async update(data: any) {
    const response = await apiClient.put('/settings', data);
    return response.data;
  },

  async updateOnboarding(data: {
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relationship?: string;
    payment_methods: string[];
    bipe_phone_number: string;
    onboarding_completed: boolean;
  }) {
    const response = await apiClient.put('/settings/onboarding', data);
    return response.data;
  }
};
