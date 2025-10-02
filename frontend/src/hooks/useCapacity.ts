import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api';

export interface ServiceCapacity {
  id: string;
  name: string;
  percentage: number;
  occupied: number;
  total: number;
  dailyRevenue: number;
  color: string;
  waitingList: boolean;
}

export interface CapacityMetrics {
  services: ServiceCapacity[];
  summary: {
    totalOccupied: number;
    totalRevenue: number;
    averageOccupancy: number;
    servicesAtCapacity: number;
  };
}

export function useCapacity(organizationId: string) {
  return useQuery<CapacityMetrics>({
    queryKey: ['capacity', organizationId],
    queryFn: async () => {
      const data = await ApiClient.get<CapacityMetrics>(`/api/capacity`, {
        organizationId,
      });
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 30, // Refetch a cada 30 segundos
  });
}

export function useServiceSchedule(
  organizationId: string,
  serviceId: string,
  date: string
) {
  return useQuery<{
    slots: Array<{
      time: string;
      available: boolean;
      petId?: string;
      petName?: string;
    }>;
  }>({
    queryKey: ['serviceSchedule', organizationId, serviceId, date],
    queryFn: async () => {
      const data = await ApiClient.get<{
        slots: Array<{
          time: string;
          available: boolean;
          petId?: string;
          petName?: string;
        }>;
      }>(`/api/capacity/${serviceId}/schedule`, {
        organizationId,
        date,
      });
      return data;
    },
    enabled: !!serviceId && !!date,
  });
}
