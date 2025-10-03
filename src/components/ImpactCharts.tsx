import { TrendingUp, DollarSign, Hotel } from "lucide-react";
import { useDashboardStats, useRevenueTimeline } from "@/hooks/useDashboard";
import { DashboardCardSkeleton } from "./LoadingStates";

export function ImpactCharts() {
  const { data: stats } = useDashboardStats();
  const { data: revenueTimeline, isLoading: revenueLoading } = useRevenueTimeline();

  // Calculate automation percentage
  const automationRate = stats?.automationRate || 0;
  const manualRate = 100 - automationRate;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Chart 1: Work Distribution */}
      <div className="glass-card rounded-2xl p-6 hover-scale">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Quanto do Trabalho Você NÃO Precisou Fazer
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">IA resolveu sozinha</span>
              <span className="text-2xl font-bold text-ai-success">{automationRate}%</span>
            </div>
            <div className="h-8 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ai-success to-primary smooth-transition"
                style={{ width: `${automationRate}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Você entrou em ação</span>
              <span className="text-2xl font-bold text-muted-foreground">{manualRate}%</span>
            </div>
            <div className="h-8 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-muted-foreground/30 smooth-transition"
                style={{ width: `${manualRate}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-sm text-foreground flex items-start gap-2">
            <span className="text-xl">💡</span>
            <span>
              A cada 10 clientes, você só precisou aparecer em {Math.round(manualRate / 10)}. Os outros {Math.round(automationRate / 10)}? IA resolveu
              enquanto você tocava o negócio.
            </span>
          </p>
        </div>
      </div>

      {/* Chart 2: Money Working */}
      <div className="glass-card rounded-2xl p-6 hover-scale">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-ai-success" />
          Dinheiro Trabalhando Por Você (24h)
        </h3>
        {revenueLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <DashboardCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {(revenueTimeline || []).map((item, index) => {
                const maxValue = Math.max(...(revenueTimeline || []).map(i => i.value));
                const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono w-8">{item.time}</span>
                    <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-ai-success to-primary flex items-center justify-end pr-2 smooth-transition"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-xs font-bold text-white">R$ {item.value}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-midnight-blue/5 rounded-xl border border-primary/10">
              <p className="text-sm text-foreground flex items-start gap-2">
                <span className="text-xl">🌙</span>
                <span>
                  IA trabalhando 24/7 - gerando receita mesmo fora do horário comercial
                  <br />
                  <span className="text-primary font-medium">
                    Seus clientes são atendidos a qualquer hora
                  </span>
                </span>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Chart 3: Capacity Usage */}
      <div className="glass-card rounded-2xl p-6 hover-scale lg:col-span-2">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Hotel className="w-5 h-5 text-accent" />
          Seu Potencial Sendo Usado
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground font-medium">Hotel</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">8/10 vagas</span>
                <span className="text-2xl font-bold text-accent">80%</span>
                <span className="text-sm text-ai-success font-medium">💰 R$ 1.600/dia</span>
              </div>
            </div>
            <div className="h-10 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-primary smooth-transition"
                style={{ width: "80%" }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground font-medium">Creche</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">cheio!</span>
                <span className="text-2xl font-bold text-ai-success">100%</span>
                <span className="text-sm text-primary font-medium">🎉 Fila de espera</span>
              </div>
            </div>
            <div className="h-10 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ai-success to-primary smooth-transition"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-ai-pending/5 rounded-xl border border-ai-pending/20">
          <p className="text-sm text-foreground flex items-start gap-2">
            <span className="text-xl">💡</span>
            <span>
              Você está deixando 20% na mesa no hotel.
              <br />
              <button
                onClick={() => window.alert('Funcionalidade em desenvolvimento - em breve você poderá criar campanhas automáticas!')}
                className="text-primary font-medium hover:underline"
              >
                Quer que a IA faça campanha de ocupação?
              </button>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
