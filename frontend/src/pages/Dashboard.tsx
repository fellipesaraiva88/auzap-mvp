import { ImpactPanel } from '@/components/dashboard/ImpactPanel';
import { MetricCards } from '@/components/dashboard/MetricCards';

export default function Dashboard() {
  return (
    <div className="p-8 space-y-6">
      {/* Painel de Impacto */}
      <ImpactPanel />

      {/* Cards de Métricas */}
      <MetricCards />

      {/* Placeholder para futuros gráficos */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Análises e Gráficos</h3>
        <p className="text-gray-600">Em breve: Gráficos detalhados de performance e crescimento</p>
      </div>
    </div>
  );
}
