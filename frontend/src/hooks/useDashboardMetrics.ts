import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api';

export interface DashboardMetrics {
  impactData: {
    timeRecovered: string;
    moneySaved: string;
    salesClosed: number;
    workDays: number;
  };
  metricsData: {
    moneyInMotion: {
      value: number;
      conversations: number;
    };
    guaranteedRevenue: {
      value: number;
      scheduled: number;
    };
    capacityUsage: {
      percentage: number;
      occupied: number;
      total: number;
    };
    freeTime: {
      hours: number;
      minutes: number;
    };
  };
  chartsData: {
    timeSavedData: Array<{
      day: string;
      hours: number;
      revenue: number;
    }>;
    conversionsData: Array<{
      hour: string;
      conversions: number;
    }>;
    metricsComparison: Array<{
      month: string;
      withAI: number;
      withoutAI: number;
    }>;
  };
}

export function useDashboardMetrics(
  organizationId: string,
  timeRange: '7d' | '30d' | '90d' = '7d'
) {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboardMetrics', organizationId, timeRange],
    queryFn: async () => {
      const data = await ApiClient.get<DashboardMetrics>(
        `/api/metrics/dashboard`,
        {
          organizationId,
          timeRange,
        }
      );
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60, // Refetch a cada minuto
  });
}

export function useRealtimeMetrics(organizationId: string) {
  return useQuery<{ activeConversations: number; pendingMessages: number }>({
    queryKey: ['realtimeMetrics', organizationId],
    queryFn: async () => {
      const data = await ApiClient.get<{
        activeConversations: number;
        pendingMessages: number;
      }>(`/api/metrics/realtime`, {
        organizationId,
      });
      return data;
    },
    refetchInterval: 1000 * 5, // Atualiza a cada 5 segundos
  });
}
