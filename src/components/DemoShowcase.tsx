import { useState } from "react";
import { MessageBadge, MessageBadgeList } from "./MessageBadges";
import { AIActionBadge, AIStatusBadge } from "./AIActionBadge";
import { ActionToast } from "./ActionToast";
import { Sparkles } from "lucide-react";

export function DemoShowcase() {
  const [showToast, setShowToast] = useState(false);

  return (
    <div className="glass-card rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 rounded-xl p-2">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            🎨 Sistema de Notificações e Badges
          </h2>
          <p className="text-sm text-muted-foreground">
            Elementos visuais que mostram ações da IA em tempo real
          </p>
        </div>
      </div>

      {/* Message Badges Demo */}
      <div className="space-y-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Badges de Mensagem (usados em conversas):
          </h3>
          <MessageBadgeList 
            badges={[
              "ai_responded",
              "booking_created",
              "pet_registered",
              "sale_registered"
            ]} 
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Badges de Escalação:
          </h3>
          <div className="flex flex-wrap gap-2">
            <MessageBadge type="human_responded" />
            <MessageBadge type="ai_escalated" />
            <MessageBadge type="customer_updated" />
          </div>
        </div>
      </div>

      {/* Status Badges Demo */}
      <div className="space-y-4 mb-6 pb-6 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Badges de Status da IA:
        </h3>
        <div className="flex flex-wrap gap-3">
          <AIStatusBadge status="success" label="Ação concluída" />
          <AIStatusBadge status="pending" label="Processando..." />
          <AIStatusBadge status="escalated" label="Requer atenção" />
        </div>
      </div>

      {/* Action Badge Demo */}
      <div className="space-y-4 mb-6 pb-6 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Badge de Ações Múltiplas:
        </h3>
        <AIActionBadge 
          actions={[
            { type: "cadastro", count: 2 },
            { type: "agendamento", count: 1 },
            { type: "followup", count: 1 }
          ]} 
        />
      </div>

      {/* Toast Demo */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Notificação Toast (aparece no canto):
        </h3>
        <button
          onClick={() => setShowToast(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 smooth-transition font-medium"
        >
          🚀 Mostrar Notificação de Ação
        </button>
        <p className="text-xs text-muted-foreground">
          Clique para ver exemplo de notificação quando a IA executa uma ação
        </p>
      </div>

      {showToast && (
        <ActionToast
          title="🎉 IA cadastrou novo cliente!"
          customerName="Ana Silva"
          petName="Pet: Rex (cachorro)"
          actionDetails="Agendou banho para 02/10 às 14h"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
