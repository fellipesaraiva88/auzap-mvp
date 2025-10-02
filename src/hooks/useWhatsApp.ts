import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface WhatsAppInstance {
  id: string;
  organization_id: string;
  instance_id: string;
  phone_number: string;
  status: 'connected' | 'disconnected' | 'connecting';
  qr_code?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppStatus {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'connecting';
  instance: WhatsAppInstance | null;
  timestamp: string;
}

export function useWhatsAppStatus(instanceId: string, enabled = true) {
  return useQuery({
    queryKey: ['whatsapp', 'status', instanceId],
    queryFn: async () => {
      const response = await apiClient.get<WhatsAppStatus>(
        `/api/whatsapp/instances/${instanceId}/status`
      );
      return response.data;
    },
    enabled: !!instanceId && enabled,
    refetchInterval: 15000, // Check every 15 seconds
    staleTime: 10000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { instanceId: string; to: string; message: string }) => {
      const response = await apiClient.post('/api/whatsapp/send', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await apiClient.delete(`/api/whatsapp/instances/${instanceId}`);
      return response.data;
    },
    onSuccess: (_, instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status', instanceId] });
    },
  });
}
