import { Clock, DollarSign, Target, Moon } from "lucide-react";

export function ImpactHero() {
  return (
    <div className="glass-card rounded-2xl p-8 mb-8 hover-scale">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          SEU TEMPO RECUPERADO
        </h2>
        <p className="text-muted-foreground">Últimos 7 dias</p>
      </div>

      <div className="bg-gradient-to-br from-primary to-accent rounded-xl p-8 mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-8 h-8 text-white" />
          <div className="text-5xl font-bold text-white">18:32</div>
        </div>
        <p className="text-white/90 text-lg">Horas que a IA trabalhou no seu lugar</p>
      </div>

      <div className="border-t border-border/50 pt-6 mb-6">
        <p className="text-sm font-semibold text-muted-foreground mb-4">
          O QUE ISSO SIGNIFICA:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <DollarSign className="w-6 h-6 text-ai-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground mb-1">R$ 832</div>
            <p className="text-xs text-muted-foreground">
              Em valor de hora-trabalho economizado*
            </p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <Target className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground mb-1">47 vendas</div>
            <p className="text-xs text-muted-foreground">Fechadas pela IA sozinha</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <Moon className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground mb-1">2,6 dias</div>
            <p className="text-xs text-muted-foreground">
              De trabalho que você NÃO precisou fazer este mês
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          * Baseado em R$ 45/hora (salário médio atendente)
        </p>
      </div>

      <div className="border-t border-border/50 pt-6 bg-gradient-to-r from-midnight-blue/5 to-primary/5 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <Moon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              ENQUANTO VOCÊ DORMIA (Última noite - 22h às 8h):
            </h3>
          </div>
        </div>
        <div className="space-y-2 ml-9">
          <div className="flex items-center gap-2">
            <span className="text-ai-success text-xl">✓</span>
            <span className="text-sm text-foreground">8 clientes atendidos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ai-success text-xl">✓</span>
            <span className="text-sm text-foreground">3 agendamentos confirmados para hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ai-success text-xl">✓</span>
            <span className="text-sm text-foreground">2 vendas de ração fechadas (R$ 340)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ai-success text-xl">✓</span>
            <span className="text-sm text-foreground">12 follow-ups enviados</span>
          </div>
        </div>
        <div className="mt-4 ml-9 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          <span className="text-sm font-medium text-primary">A IA não dorme. Você pode.</span>
        </div>
      </div>
    </div>
  );
}
