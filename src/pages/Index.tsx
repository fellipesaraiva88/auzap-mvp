import { ImpactHero } from "@/components/ImpactHero";
import { ImpactCards } from "@/components/ImpactCards";
import { AITimeline } from "@/components/AITimeline";
import { ImpactCharts } from "@/components/ImpactCharts";
import { AlertCircle } from "lucide-react";
import { DemoShowcase } from "@/components/DemoShowcase";
import { QuickActions } from "@/components/QuickActions";
import { SystemOverview } from "@/components/SystemOverview";

const Index = () => {
  return (
    <div className="min-h-screen bg-background paw-pattern">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8 fade-in">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Oi Maria! 👋
              </h1>
              <p className="text-muted-foreground text-lg">
                A IA já atendeu <span className="text-primary font-semibold">23 clientes</span> hoje!
              </p>
            </div>
            <div>
              <QuickActions />
            </div>
          </div>
        </div>

        {/* System Overview - Visão Geral do Sistema */}
        <SystemOverview />

        {/* Impact Hero Section - Tempo Recuperado */}
        <ImpactHero />

        {/* Impact Cards - Métricas de Impacto */}
        <ImpactCards />

        {/* AI Timeline - O que aconteceu enquanto você vivia sua vida */}
        <AITimeline />

        {/* Impact Charts - Gráficos de Significado */}
        <ImpactCharts />

        {/* Demo Showcase - Sistema de Notificações */}
        <DemoShowcase />

        {/* Only You Can Resolve Section - Redesigned */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="bg-ai-escalated/10 rounded-xl p-2">
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

          <div className="space-y-4">
            {/* Escalated - Urgent Human Touch */}
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
              <button className="ml-6 mt-2 text-xs font-medium text-ai-escalated hover:underline">
                Ver conversas →
              </button>
            </div>

            {/* Pending - Important Reminders */}
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
              <button className="ml-6 mt-2 text-xs font-medium text-ai-pending hover:underline">
                Ver pets →
              </button>
            </div>

            {/* Success - Ready Actions */}
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
              <button className="ml-6 mt-2 text-xs font-medium text-ai-success hover:underline">
                Ver agenda →
              </button>
            </div>

            {/* Info - Awaiting Confirmation */}
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
              <button className="ml-6 mt-2 text-xs font-medium text-primary hover:underline">
                Ver vendas →
              </button>
            </div>
          </div>

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
