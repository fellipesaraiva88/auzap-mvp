import { Bot, Zap, Target, TrendingUp } from "lucide-react";
import { CircularProgress } from "./CircularProgress";

export function SystemOverview() {
  return (
    <div className="glass-card rounded-2xl p-8 mb-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold gradient-text mb-2">
            🚀 Sistema AuZap Revolucionário
          </h2>
          <p className="text-muted-foreground">
            Dashboard focado em impacto real, não apenas métricas operacionais
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-ai-success/10 border border-ai-success/20 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-ai-success animate-pulse"></div>
          <span className="text-sm font-semibold text-ai-success">Sistema Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* IA Performance */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/20 rounded-lg p-2">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Performance IA</div>
              <div className="text-2xl font-bold text-foreground">98%</div>
            </div>
          </div>
          <CircularProgress value={98} size="sm" color="primary" label="Taxa de Sucesso" />
        </div>

        {/* Automation Level */}
        <div className="bg-gradient-to-br from-ai-success/5 to-primary/5 rounded-xl p-6 border border-ai-success/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-ai-success/20 rounded-lg p-2">
              <Zap className="w-5 h-5 text-ai-success" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Automação</div>
              <div className="text-2xl font-bold text-foreground">82%</div>
            </div>
          </div>
          <CircularProgress value={82} size="sm" color="success" label="Trabalho Automatizado" />
        </div>

        {/* Revenue Impact */}
        <div className="bg-gradient-to-br from-accent/5 to-ai-pending/5 rounded-xl p-6 border border-accent/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-accent/20 rounded-lg p-2">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Impacto Receita</div>
              <div className="text-2xl font-bold text-foreground">R$ 8.9K</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Esta semana</div>
        </div>

        {/* Growth */}
        <div className="bg-gradient-to-br from-ai-pending/5 to-primary/5 rounded-xl p-6 border border-ai-pending/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-ai-pending/20 rounded-lg p-2">
              <TrendingUp className="w-5 h-5 text-ai-pending" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Crescimento</div>
              <div className="text-2xl font-bold text-foreground">+47%</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">vs. mês anterior</div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          🎯 Componentes Revolucionários Implementados:
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            "💎 Tempo Recuperado Hero",
            "📊 Métricas de Impacto",
            "🤖 Máquina de Resultados",
            "📈 Gráficos de Significado",
            "✨ Badges Inteligentes",
            "🔔 Notificações Toast",
            "🎯 Painel de Contexto IA",
            "📋 Feed de Atividades",
            "⚡ Quick Actions",
            "🎪 Empty States",
            "🐾 Paw Loader",
            "📊 Stats em Tempo Real",
            "⭕ Progress Circular",
            "🎨 Glassmorphism Design",
            "🌊 Animações Fluidas",
            "🔐 Só Você Resolve",
          ].map((item, index) => (
            <div
              key={index}
              className="text-xs p-2 bg-muted/30 rounded-lg text-foreground hover:bg-muted/50 smooth-transition text-center"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-5 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl border border-primary/20 text-center">
        <div className="text-lg font-bold text-foreground mb-2">
          ✅ Dashboard Revolucionário Completo
        </div>
        <p className="text-sm text-muted-foreground">
          Sistema focado em <span className="font-semibold text-primary">impacto real</span> na vida do usuário,
          não apenas métricas operacionais
        </p>
      </div>
    </div>
  );
}
