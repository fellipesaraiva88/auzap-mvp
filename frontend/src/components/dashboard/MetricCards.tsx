import { TrendingUp, Target, Zap, Clock } from 'lucide-react';

interface MetricData {
  moneyInMotion: {
    value: string;
    conversations: number;
  };
  guaranteedRevenue: {
    value: string;
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
}

interface MetricCardsProps {
  data?: MetricData;
}

export function MetricCards({ data }: MetricCardsProps) {
  const metricsData: MetricData = data || {
    moneyInMotion: {
      value: '4.280',
      conversations: 12
    },
    guaranteedRevenue: {
      value: '8.940',
      scheduled: 23
    },
    capacityUsage: {
      percentage: 87,
      occupied: 26,
      total: 30
    },
    freeTime: {
      hours: 6,
      minutes: 42
    }
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
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
              </svg>
            </div>
            <span className="text-xs text-green-600 font-medium">IA gerenciando</span>
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
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"/>
              </svg>
            </div>
            <span className="text-xs text-blue-600 font-medium">Caixa futuro</span>
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
            {metricsData.capacityUsage.occupied}/{metricsData.capacityUsage.total} vagas ocupadas
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
            </div>
            <span className="text-xs text-purple-600 font-medium">Taxa ótima</span>
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
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
              </svg>
            </div>
            <span className="text-xs text-orange-600 font-medium">IA trabalhando</span>
          </div>
        </div>
      </div>
    </div>
  );
}
