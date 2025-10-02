import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle, Clock, Calendar, MessageSquare, Zap } from "lucide-react";
import { mockFollowups } from "@/data/mockData";

export default function IA() {
  const pendingFollowups = mockFollowups.filter((f) => f.status === "pending").length;
  const sentFollowups = mockFollowups.filter((f) => f.status === "sent").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Inteligência Artificial"
        subtitle="Configure e monitore sua assistente virtual"
        actions={
          <Button>
            <Bot className="w-4 h-4" />
            Configurar IA
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Bot}
          title="Status da IA"
          value="Ativa"
          subtitle="Funcionando 24/7"
        />
        <StatCard
          icon={MessageSquare}
          title="Conversas Hoje"
          value="23"
          subtitle="Atendidas pela IA"
        />
        <StatCard
          icon={Zap}
          title="Ações Executadas"
          value="47"
          subtitle="Últimas 24h"
        />
        <StatCard
          icon={Clock}
          title="Tempo Economizado"
          value="4h 23min"
          subtitle="Hoje"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Status e Configuração */}
        <Card className="col-span-8 glass-card">
          <CardHeader>
            <CardTitle>Status da Conexão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">WhatsApp Conectado</h4>
                    <p className="text-sm text-muted-foreground">
                      +55 11 99999-9999
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-500">
                  Online
                </Badge>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="font-semibold mb-4">Personalidade da IA</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nome da Atendente:</span>
                    <span className="font-medium">Maria</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estilo:</span>
                    <span className="font-medium">Carinhosa e Acolhedora</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Idioma:</span>
                    <span className="font-medium">Português</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Editar Personalidade
                </Button>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="font-semibold mb-4">Ações Automáticas</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Cadastrar clientes</span>
                    <Badge variant="default" className="bg-green-500">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Cadastrar pets</span>
                    <Badge variant="default" className="bg-green-500">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Criar agendamentos</span>
                    <Badge variant="default" className="bg-green-500">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Registrar vendas</span>
                    <Badge variant="default" className="bg-green-500">
                      Ativo
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Follow-ups */}
        <Card className="col-span-4 glass-card">
          <CardHeader>
            <CardTitle>Follow-ups Automáticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pendentes</span>
                <span className="font-semibold text-yellow-600">{pendingFollowups}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Enviados Hoje</span>
                <span className="font-semibold text-green-600">{sentFollowups}</span>
              </div>
            </div>

            <div className="space-y-3">
              {mockFollowups.slice(0, 3).map((followup) => (
                <div
                  key={followup.id}
                  className="p-3 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-ocean-blue" />
                      <span className="text-sm font-medium">
                        {followup.type === "appointment_reminder"
                          ? "Lembrete"
                          : followup.type === "feedback"
                          ? "Feedback"
                          : "Vacina"}
                      </span>
                    </div>
                    <Badge
                      variant={
                        followup.status === "pending" ? "secondary" : "default"
                      }
                    >
                      {followup.status === "pending" ? "Pendente" : "Enviado"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {followup.customerName} • {followup.petName}
                  </p>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4">
              Ver Todos os Follow-ups
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
