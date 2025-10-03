import { api } from './api';

export const bipeService = {
  async listPending() {
    const response = await api.get('/bipe/pending');
    return response.data;
  },

  async respond(bipeId: string, managerResponse: string) {
    const response = await api.post(`/bipe/${bipeId}/respond`, {
      manager_response: managerResponse
    });
    return response.data;
  },

  async reactivateAI(conversationId: string) {
    const response = await api.post(`/bipe/reactivate/${conversationId}`);
    return response.data;
  },

  async getKnowledgeStats() {
    const response = await api.get('/bipe/knowledge/stats');
    return response.data;
  },

  async listKnowledge(options?: {
    source?: 'bipe' | 'manual' | 'import';
    limit?: number;
    offset?: number;
  }) {
    const response = await api.get('/bipe/knowledge', { params: options });
    return response.data;
  }
};
