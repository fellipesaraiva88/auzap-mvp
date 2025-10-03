import { ImpactHero } from "@/components/ImpactHero";
import { ImpactDashboard } from "@/components/ImpactDashboard";
import { AITimeline } from "@/components/AITimeline";
import { ImpactCharts } from "@/components/ImpactCharts";
import { AlertCircle, Clock, TrendingUp, Zap } from "lucide-react";
import { QuickActions } from "@/components/QuickActions";
import { WhatsAppStatusCard } from "@/components/WhatsAppStatus";
import { PendingFollowupsCard } from "@/components/PendingFollowups";
import { AIPersonalityCard } from "@/components/AIPersonalityCard";
import { AutomationBadges } from "@/components/AutomationBadges";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardSocketUpdates } from "@/hooks/useSocket";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: impactMetrics, isLoading: isLoadingMetrics } = useDashboardMetrics();

  // Enable real-time updates via Socket.io
  useDashboardSocketUpdates();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const userName = user?.full_name?.split(' ')[0] || 'Usuário';
  const isWhatsAppOnline = stats?.whatsappStatus === 'connected';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        
        {/* Header Section */}
        <header className="fade-in">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                Oi {userName}! 👋
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                A IA já atendeu <span className="text-primary font-bold">{stats?.conversationsToday || 0} clientes</span> hoje e está trabalhando agora
              </p>
            </div>
            <div className="flex items-center gap-3">
              <WhatsAppStatusCard instanceId={user?.organization?.whatsapp_instance_id || 'default'} />
              <QuickActions />
            </div>
          </div>
        </header>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 fade-in">
          <div className="glass-card rounded-xl p-4 hover-scale">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Trabalhando</span>
            </div>
            <div className="text-2xl font-bold gradient-text">{stats?.activeConversations || 0} agora</div>
          </div>
          <div className="glass-card rounded-xl p-4 hover-scale">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-ai-success" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Mensagens Hoje</span>
            </div>
            <div className="text-2xl font-bold text-ai-success">{stats?.messagesToday || 0}</div>
          </div>
          <div className="glass-card rounded-xl p-4 hover-scale">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Taxa IA</span>
            </div>
            <div className="text-2xl font-bold text-accent">{stats?.automationRate || 0}%</div>
          </div>
          <div className="glass-card rounded-xl p-4 hover-scale">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-ai-escalated" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Requer você</span>
            </div>
            <div className="text-2xl font-bold text-ai-escalated">{stats?.escalatedConversations || 0} casos</div>
          </div>
        </div>

        {/* Main Impact Hero */}
        <ImpactHero />

        {/* Priority Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
          <AIPersonalityCard />
          <PendingFollowupsCard />
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Ações Rápidas</h3>
            <QuickActions />
          </div>
        </div>

        {/* Automation Badges */}
        <AutomationBadges />

        {/* Impact Dashboard - Métricas de Valor em Tempo Real */}
        {impactMetrics && (
          <ImpactDashboard 
            metrics={impactMetrics} 
            isLoading={isLoadingMetrics}
          />
        )}

        {/* AI Activity Machine */}
        <AITimeline />

        {/* Performance Charts */}
        <ImpactCharts />

        {/* Action Required Section */}
        <div className="glass-card rounded-2xl p-6 fade-in">
          <div className="flex items-start gap-3 mb-6">
            <div className="bg-ai-escalated/10 rounded-xl p-2.5">
              <AlertCircle className="w-6 h-6 text-ai-escalated" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                🎯 Aqui Só Você Resolve
              </h2>
              <p className="text-sm text-muted-foreground">
                Onde você é insubstituível
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Escalated - Urgent */}
            <div className="p-5 bg-gradient-to-r from-ai-escalated/10 to-ai-escalated/5 rounded-xl border-l-4 border-ai-escalated hover:shadow-lg smooth-transition cursor-pointer group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-ai-escalated animate-pulse"></div>
                  <span className="text-sm font-bold text-foreground group-hover:text-ai-escalated smooth-transition">
                    🔴 3 pessoas esperando seu toque humano
                  </span>
                </div>
                <span className="text-xs text-ai-escalated font-semibold bg-ai-escalated/10 px-2 py-1 rounded-full">
                  URGENTE
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                IA escalou porque detectou que você é necessário
              </p>
              <button
                onClick={() => navigate('/conversas?filter=escalated')}
                className="ml-6 mt-2 text-xs font-medium text-ai-escalated hover:underline"
              >
                Ver conversas →
              </button>
            </div>

            {/* Pending - Important */}
            <div className="p-5 bg-gradient-to-r from-ai-pending/10 to-ai-pending/5 rounded-xl border-l-4 border-ai-pending hover:shadow-lg smooth-transition cursor-pointer group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-ai-pending"></div>
                  <span className="text-sm font-bold text-foreground group-hover:text-ai-pending smooth-transition">
                    🟡 2 pets com momento importante chegando
                  </span>
                </div>
                <span className="text-xs text-ai-pending font-semibold bg-ai-pending/10 px-2 py-1 rounded-full">
                  IMPORTANTE
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Vacinas vencem em 7 dias, hora de avisar tutores
              </p>
              <button
                onClick={() => navigate('/clientes?filter=upcoming-vaccines')}
                className="ml-6 mt-2 text-xs font-medium text-ai-pending hover:underline"
              >
                Ver pets →
              </button>
            </div>

            {/* Success - Ready */}
            <div className="p-5 bg-gradient-to-r from-ai-success/10 to-ai-success/5 rounded-xl border-l-4 border-ai-success hover:shadow-lg smooth-transition cursor-pointer group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-ai-success"></div>
                  <span className="text-sm font-bold text-foreground group-hover:text-ai-success smooth-transition">
                    🟢 5 pets voltando pra casa hoje
                  </span>
                </div>
                <span className="text-xs text-ai-success font-semibold bg-ai-success/10 px-2 py-1 rounded-full">
                  PRONTO
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Check-outs de hotel programados
              </p>
              <button
                onClick={() => navigate('/agenda?filter=today-checkouts')}
                className="ml-6 mt-2 text-xs font-medium text-ai-success hover:underline"
              >
                Ver agenda →
              </button>
            </div>

            {/* Info - Awaiting */}
            <div className="p-5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border-l-4 border-primary hover:shadow-lg smooth-transition cursor-pointer group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-sm font-bold text-foreground group-hover:text-primary smooth-transition">
                    🔵 2 pagamentos precisam de atenção
                  </span>
                </div>
                <span className="text-xs text-primary font-semibold bg-primary/10 px-2 py-1 rounded-full">
                  AGUARDANDO
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Aguardando confirmação
              </p>
              <button
                onClick={() => navigate('/vendas?filter=pending-confirmation')}
                className="ml-6 mt-2 text-xs font-medium text-primary hover:underline"
              >
                Ver vendas →
              </button>
            </div>
          </div>

          {/* Bottom Message */}
          <div className="mt-6 p-5 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl border border-primary/10 text-center">
            <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
              <span className="text-2xl">💡</span>
              <span className="font-semibold">Todo o resto? A IA já resolveu.</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Você só aparece onde realmente faz diferença
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
