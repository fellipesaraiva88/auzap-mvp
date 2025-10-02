import { ImpactHero } from "@/components/ImpactHero";
import { ImpactCards } from "@/components/ImpactCards";
import { AITimeline } from "@/components/AITimeline";
import { ImpactCharts } from "@/components/ImpactCharts";
import { AlertCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background paw-pattern">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8 fade-in">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Oi Maria! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            A IA já atendeu <span className="text-primary font-semibold">23 clientes</span> hoje!
          </p>
        </div>

        {/* Impact Hero Section - Tempo Recuperado */}
        <ImpactHero />

        {/* Impact Cards - Métricas de Impacto */}
        <ImpactCards />

        {/* AI Timeline - O que aconteceu enquanto você vivia sua vida */}
        <AITimeline />

        {/* Impact Charts - Gráficos de Significado */}
        <ImpactCharts />

        {/* Only You Can Resolve Section */}
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
            <div className="p-4 bg-ai-escalated/5 rounded-xl border border-ai-escalated/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-ai-escalated"></span>
                <span className="text-sm font-semibold text-foreground">
                  3 pessoas esperando seu toque humano
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-5">
                IA escalou porque detectou que você é necessário
              </p>
            </div>

            <div className="p-4 bg-ai-pending/5 rounded-xl border border-ai-pending/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-ai-pending"></span>
                <span className="text-sm font-semibold text-foreground">
                  2 pets com momento importante chegando
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-5">
                Vacinas vencem em 7 dias, hora de avisar tutores
              </p>
            </div>

            <div className="p-4 bg-ai-success/5 rounded-xl border border-ai-success/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-ai-success"></span>
                <span className="text-sm font-semibold text-foreground">
                  5 pets voltando pra casa hoje
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-5">
                Check-outs de hotel programados
              </p>
            </div>

            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-sm font-semibold text-foreground">
                  2 pagamentos precisam de atenção
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-5">
                Aguardando confirmação
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10 text-center">
            <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
              <span className="text-xl">💡</span>
              <span>Todo o resto? A IA já resolveu.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
