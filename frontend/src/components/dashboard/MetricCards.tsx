import {
  TrendingUp,
  Target,
  Zap,
  Clock,
  Cpu,
  Calendar,
  ChartBar,
} from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useTenant } from '@/hooks/useTenant';
import { SkeletonCard } from '@/components/ui/Skeleton';

export function MetricCards() {
  const { organizationId } = useTenant();
  const { data, isLoading } = useDashboardMetrics(organizationId, '7d');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!data) return null;

  const metricsData = {
    moneyInMotion: {
      value: data.metricsData.moneyInMotion.value.toLocaleString('pt-BR'),
      conversations: data.metricsData.moneyInMotion.conversations,
    },
    guaranteedRevenue: {
      value: data.metricsData.guaranteedRevenue.value.toLocaleString('pt-BR'),
      scheduled: data.metricsData.guaranteedRevenue.scheduled,
    },
    capacityUsage: {
      percentage: data.metricsData.capacityUsage.percentage,
      occupied: data.metricsData.capacityUsage.occupied,
      total: data.metricsData.capacityUsage.total,
    },
    freeTime: {
      hours: data.metricsData.freeTime.hours,
      minutes: data.metricsData.freeTime.minutes,
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Dinheiro em Movimento */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Dinheiro em</h3>
              <p className="text-sm text-gray-500">Movimento</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold text-green-600">
            R$ {metricsData.moneyInMotion.value}
          </div>
          <p className="text-sm text-gray-600">
            {metricsData.moneyInMotion.conversations} conversas acontecendo
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <Cpu className="w-2 h-2 text-white" />
            </div>
            <span className="text-xs text-green-600 font-medium">
              IA gerenciando
            </span>
          </div>
        </div>
      </div>

      {/* Receita Garantida */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Receita</h3>
              <p className="text-sm text-gray-500">Garantida</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold text-blue-600">
            R$ {metricsData.guaranteedRevenue.value}
          </div>
          <p className="text-sm text-gray-600">
            {metricsData.guaranteedRevenue.scheduled} agendados esta semana
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <Calendar className="w-2 h-2 text-white" />
            </div>
            <span className="text-xs text-blue-600 font-medium">
              Caixa futuro
            </span>
          </div>
        </div>
      </div>

      {/* Potencial Sendo Usado */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Potencial</h3>
              <p className="text-sm text-gray-500">Sendo Usado</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold text-purple-600">
            🏨 {metricsData.capacityUsage.percentage}%
          </div>
          <p className="text-sm text-gray-600">
            {metricsData.capacityUsage.occupied}/
            {metricsData.capacityUsage.total} vagas ocupadas
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
              <ChartBar className="w-2 h-2 text-white" />
            </div>
            <span className="text-xs text-purple-600 font-medium">
              Taxa ótima
            </span>
          </div>
        </div>
      </div>

      {/* Você Estava Livre */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Você estava</h3>
              <p className="text-sm text-gray-500">Livre</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold text-orange-600">
            {metricsData.freeTime.hours}h {metricsData.freeTime.minutes}min
          </div>
          <p className="text-sm text-gray-600">hoje</p>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
              <Cpu className="w-2 h-2 text-white" />
            </div>
            <span className="text-xs text-orange-600 font-medium">
              IA trabalhando
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
