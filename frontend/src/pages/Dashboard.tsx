import { ImpactPanel } from '@/components/dashboard/ImpactPanel';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { ImpactCharts } from '@/components/dashboard/ImpactCharts';
import { CapacityUsage } from '@/components/dashboard/CapacityUsage';

export default function Dashboard() {
  return (
    <div className="p-8 space-y-6">
      {/* Painel de Impacto */}
      <ImpactPanel />

      {/* Cards de Métricas */}
      <MetricCards />

      {/* Gráficos de Performance */}
      <ImpactCharts />

      {/* Ocupação dos Serviços */}
      <CapacityUsage />
    </div>
  );
}
