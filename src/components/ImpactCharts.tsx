import { TrendingUp, DollarSign, Hotel } from "lucide-react";

export function ImpactCharts() {
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
              <span className="text-2xl font-bold text-ai-success">82%</span>
            </div>
            <div className="h-8 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ai-success to-primary smooth-transition"
                style={{ width: "82%" }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Você entrou em ação</span>
              <span className="text-2xl font-bold text-muted-foreground">18%</span>
            </div>
            <div className="h-8 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-muted-foreground/30 smooth-transition"
                style={{ width: "18%" }}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-sm text-foreground flex items-start gap-2">
            <span className="text-xl">💡</span>
            <span>
              A cada 10 clientes, você só precisou aparecer em 2. Os outros 8? IA resolveu
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
        <div className="space-y-3">
          {[
            { time: "08h", value: 340, height: 30 },
            { time: "10h", value: 520, height: 45 },
            { time: "12h", value: 850, height: 70 },
            { time: "14h", value: 680, height: 55 },
            { time: "16h", value: 340, height: 30 },
            { time: "18h", value: 520, height: 45 },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono w-8">{item.time}</span>
              <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ai-success to-primary flex items-center justify-end pr-2 smooth-transition"
                  style={{ width: `${item.height}%` }}
                >
                  <span className="text-xs font-bold text-white">R$ {item.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-midnight-blue/5 rounded-xl border border-primary/10">
          <p className="text-sm text-foreground flex items-start gap-2">
            <span className="text-xl">🌙</span>
            <span>
              Até de madrugada: R$ 180 (02h-06h)
              <br />
              <span className="text-primary font-medium">
                IA fechando vendas enquanto você dormia
              </span>
            </span>
          </p>
        </div>
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
              <button className="text-primary font-medium hover:underline">
                Quer que a IA faça campanha de ocupação?
              </button>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
