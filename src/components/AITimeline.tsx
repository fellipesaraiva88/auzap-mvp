import { Bot, Clock, ChevronDown, Sparkles, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { useState } from "react";

export function AITimeline() {
  const [isExpanded, setIsExpanded] = useState(true);

  const actions = [
    {
      time: "14:32",
      icon: Sparkles,
      title: "🎉 Thor entrou no sistema",
      subtitle: "Tutora Ana Silva conhecida pela IA",
      highlight: "⚡ Você não digitou nada",
      color: "text-ai-success",
      bgColor: "bg-ai-success/10",
    },
    {
      time: "14:28",
      icon: DollarSign,
      title: "💰 R$ 80 garantido no caixa",
      subtitle: "Rex vem tomar banho dia 03/10 às 14h",
      highlight: "⚡ IA agendou sozinha",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      time: "14:15",
      icon: ShoppingCart,
      title: "💵 R$ 180 na conta",
      subtitle: "João comprou Ração Premium",
      highlight: "⚡ Venda fechada pela IA",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 mb-8">
      <div
        className="flex items-center justify-between cursor-pointer mb-6"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-2">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              🤖 Máquina de Resultados (Últimas 24h)
            </h2>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground smooth-transition ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Stats Grid - 6 cards em 2 linhas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10 hover-scale">
          <div className="text-2xl font-bold text-foreground mb-1">12</div>
          <div className="text-xs text-muted-foreground">🐾 Pets Cadastrados</div>
        </div>
        <div className="bg-gradient-to-br from-ai-success/5 to-primary/5 rounded-xl p-4 border border-ai-success/10 hover-scale">
          <div className="text-2xl font-bold text-foreground mb-1">8</div>
          <div className="text-xs text-muted-foreground">👥 Clientes Atualizados</div>
        </div>
        <div className="bg-gradient-to-br from-accent/5 to-ai-pending/5 rounded-xl p-4 border border-accent/10 hover-scale">
          <div className="text-2xl font-bold text-foreground mb-1">15</div>
          <div className="text-xs text-muted-foreground">📅 Agendas Criadas</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 hover-scale">
          <div className="text-2xl font-bold text-foreground mb-1">7</div>
          <div className="text-xs text-muted-foreground">💰 Vendas Registradas</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 hover-scale">
          <div className="text-2xl font-bold text-foreground mb-1">23</div>
          <div className="text-xs text-muted-foreground">🔔 Follow-ups Enviados</div>
        </div>
        <div className="bg-ai-escalated/5 rounded-xl p-4 border border-ai-escalated/20 hover-scale">
          <div className="text-2xl font-bold text-ai-escalated mb-1">3</div>
          <div className="text-xs text-muted-foreground">⚠️ Escalações Necessárias</div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/50 pt-6 fade-in">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            📋 Últimas Ações (real-time):
          </h3>
          <div className="space-y-3">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl hover:from-muted/50 hover:to-muted/20 smooth-transition hover-scale"
              >
                <div className={`${action.bgColor} rounded-lg p-2.5 mt-0.5`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-foreground text-sm">{action.title}</h4>
                    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      ⏰ {action.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1.5">{action.subtitle}</p>
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {action.highlight}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-sm text-primary font-medium hover:underline">
            Ver tudo que aconteceu →
          </button>
        </div>
      )}
    </div>
  );
}
