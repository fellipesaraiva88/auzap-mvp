import { PageHeader } from '@/components/PageHeader';
import { AIHeroCard } from '@/components/ai/AIHeroCard';
import { AIMetricCard } from '@/components/ai/AIMetricCard';
import { AIActivityFeed } from '@/components/ai/AIActivityFeed';
import { AIConfigTabs } from '@/components/ai/AIConfigTabs';
import { AIHealthBadge } from '@/components/ai/AIHealthBadge';
import { WhatsAppSyncCard } from '@/components/ai/WhatsAppSyncCard';
import { BipeNotifications } from '@/components/ai/BipeNotifications';
import { AIPlayground } from '@/components/ai/AIPlayground';
import { useAIMetrics } from '@/hooks/useAIMetrics';
import { useAIActivity } from '@/hooks/useAIActivity';
import { useAIConfig } from '@/hooks/useAIConfig';
import { useWhatsAppInstances } from '@/hooks/useWhatsApp';
import { MessageCircle, Calendar, Users } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function IA() {
  const { metrics, isLoading: loadingMetrics } = useAIMetrics();
  const { activities, isLoading: loadingActivities } = useAIActivity();
  const { config, updateConfig } = useAIConfig();
  const { data: instancesData, refetch: refetchInstances } = useWhatsAppInstances();

  const instances = instancesData?.instances || [];
  const primaryInstance = instances[0];

  if (loadingMetrics) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Sua Assistente Virtual"
        subtitle="Trabalhando 24/7 para você crescer"
      />

      {/* BIPE Notifications - Prioridade Máxima */}
      <BipeNotifications />

      {/* AI Playground */}
      <AIPlayground />

      {/* Hero Card - Impacto */}
      <AIHeroCard
        conversations={metrics?.conversationsToday || 0}
        timeSaved={metrics?.timeSaved || '0h 0min'}
        revenue={metrics?.revenue || 0}
        activityData={metrics?.activityByHour || []}
      />

      {/* Métricas Visuais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AIMetricCard
          icon={MessageCircle}
          value={metrics?.conversationsToday || 0}
          label="Clientes Atendidos Hoje"
          iconColor="text-ocean-blue"
          iconBg="bg-ocean-blue/10"
        />
        <AIMetricCard
          icon={Calendar}
          value={metrics?.bookingsCreated || 0}
          label="Agendamentos Criados"
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <AIMetricCard
          icon={Users}
          value={(metrics?.contactsRegistered || 0) + (metrics?.petsRegistered || 0)}
          label="Cadastros Realizados"
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Grid 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed de Atividade */}
        <div className="lg:col-span-2">
          <AIActivityFeed activities={activities} isLoading={loadingActivities} />
        </div>

        {/* Status e Sincronização */}
        <div className="space-y-4">
          {/* WhatsApp Sync Card */}
          <WhatsAppSyncCard
            instance={primaryInstance}
            onUpdate={refetchInstances}
          />

          {/* Health Badge */}
          <AIHealthBadge
            status={primaryInstance?.status || 'disconnected'}
            lastUpdate={primaryInstance?.last_connected_at}
            phoneNumber={primaryInstance?.phone_number}
            details={{
              instanceId: primaryInstance?.instanceId || '',
            }}
          />
        </div>
      </div>

      {/* Configurações */}
      <AIConfigTabs config={config} onSave={updateConfig} />
    </div>
  );
}
