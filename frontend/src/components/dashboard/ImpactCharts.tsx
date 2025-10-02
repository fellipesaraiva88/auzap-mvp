import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useTenant } from '@/hooks/useTenant';
import { Skeleton } from '@/components/ui/Skeleton';

export function ImpactCharts() {
  const { organizationId } = useTenant();
  const { data, isLoading } = useDashboardMetrics(organizationId, '7d');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
        <div className="lg:col-span-2">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const timeSavedData = data.chartsData.timeSavedData;
  const conversionsData = data.chartsData.conversionsData;
  const metricsComparisonData = data.chartsData.metricsComparison;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Tempo Economizado vs Receita */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⏱️ Tempo Economizado vs Receita Gerada
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSavedData}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorHours)"
              name="Horas Economizadas"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Receita (R$)"
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-600 mt-4 text-center">
          💡 Quanto mais a IA trabalha, mais você fatura
        </p>
      </div>

      {/* Conversões por Hora do Dia */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Conversões Automáticas por Horário
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={conversionsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="hour" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
              formatter={(value) => [`${value} conversões`, 'Total']}
            />
            <Bar
              dataKey="conversions"
              fill="#8b5cf6"
              radius={[8, 8, 0, 0]}
              name="Conversões"
            />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-600 mt-4 text-center">
          🌙 A IA trabalha mesmo quando você dorme
        </p>
      </div>

      {/* Comparação: Com IA vs Sem IA */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🚀 Evolução: Com IA vs Sem IA
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metricsComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="withAI"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 6 }}
              name="Com IA AuZap"
            />
            <Line
              type="monotone"
              dataKey="withoutAI"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: '#ef4444', r: 6 }}
              name="Sem IA"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <p className="text-center text-green-800 font-medium">
            💎 <strong>Diferença de performance:</strong> +120% em atendimentos
            convertidos com IA
          </p>
        </div>
      </div>
    </div>
  );
}
