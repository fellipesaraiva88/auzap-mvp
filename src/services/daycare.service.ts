import { apiClient } from './api';

export const daycareService = {
  async list(filters?: {
    status?: string;
    stayType?: 'daycare' | 'hotel';
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get('/daycare/stays', { params: filters });
    return response.data;
  },

  async getById(stayId: string) {
    const response = await api.get(`/daycare/stays/${stayId}`);
    return response.data;
  },

  async create(data: {
    pet_id: string;
    contact_id: string;
    health_assessment: {
      vacinas: boolean;
      vermifugo: boolean;
      exames?: string[];
      restricoes_alimentares?: string[];
    };
    behavior_assessment: {
      socializacao: string;
      ansiedade: string;
      energia: string;
      teste_adaptacao?: string;
    };
    stay_type: 'daycare' | 'hotel';
    check_in_date: string;
    check_out_date?: string;
    extra_services?: string[];
    notes?: string;
  }) {
    const response = await api.post('/daycare/stays', data);
    return response.data;
  },

  async update(stayId: string, updates: {
    status?: 'aguardando_avaliacao' | 'aprovado' | 'em_estadia' | 'finalizado' | 'cancelado';
    extra_services?: string[];
    check_out_date?: string;
    notes?: string;
  }) {
    const response = await api.put(`/daycare/stays/${stayId}`, updates);
    return response.data;
  },

  async getUpsells(stayId: string) {
    const response = await api.get(`/daycare/stays/${stayId}/upsells`);
    return response.data;
  },

  async addExtraService(stayId: string, service: string) {
    const response = await api.post(`/daycare/stays/${stayId}/services`, { service });
    return response.data;
  }
};
