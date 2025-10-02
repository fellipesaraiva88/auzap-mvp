import { Bot, Clock, ChevronDown } from "lucide-react";
import { useState } from "react";

export function AITimeline() {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      time: "14:32",
      icon: "🎉",
      title: "Thor entrou no sistema",
      subtitle: "Tutora Ana Silva conhecida pela IA",
      highlight: "⚡ Você não digitou nada",
    },
    {
      time: "14:28",
      icon: "💰",
      title: "R$ 80 garantido no caixa",
      subtitle: "Rex vem tomar banho dia 03/10 às 14h",
      highlight: "⚡ IA agendou sozinha",
    },
    {
      time: "14:15",
      icon: "💵",
      title: "R$ 180 na conta",
      subtitle: "João comprou Ração Premium",
      highlight: "⚡ Venda fechada pela IA",
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
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              🤖 IA em Ação (Últimas 24h)
            </h2>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground smooth-transition ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10">
          <div className="text-3xl font-bold text-foreground mb-1">12</div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            🐾 Pets Cadastrados
          </div>
        </div>
        <div className="bg-gradient-to-br from-ai-success/5 to-primary/5 rounded-xl p-4 border border-ai-success/10">
          <div className="text-3xl font-bold text-foreground mb-1">8</div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            👥 Clientes Atualizados
          </div>
        </div>
        <div className="bg-gradient-to-br from-accent/5 to-ai-pending/5 rounded-xl p-4 border border-accent/10">
          <div className="text-3xl font-bold text-foreground mb-1">15</div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            📅 Agendas Criados
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-foreground mb-1">7</div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            💰 Vendas Registradas
          </div>
        </div>
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-foreground mb-1">23</div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            🔔 Follow-ups Enviados
          </div>
        </div>
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-ai-escalated mb-1">3</div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            ⚠️ Escalações Necessárias
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/50 pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Últimas Ações (real-time):
          </h3>
          <div className="space-y-4">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 smooth-transition"
              >
                <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                  ⏰ {action.time}
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-xl">{action.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{action.title}</div>
                      <div className="text-sm text-muted-foreground">{action.subtitle}</div>
                      <div className="text-xs text-primary font-medium mt-1">{action.highlight}</div>
                    </div>
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
