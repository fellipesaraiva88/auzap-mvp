import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WhatsAppStatusCard } from "@/components/WhatsAppStatus";
import { Bot, CheckCircle, Clock, Calendar, MessageSquare, Zap, Settings, AlertCircle, Loader2 } from "lucide-react";
import { useWhatsAppInstances } from "@/hooks/useWhatsApp";
import { useFollowups } from "@/hooks/useFollowups";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useAuth } from "@/hooks/useAuth";

export default function IA() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: instancesData, isLoading: loadingInstances } = useWhatsAppInstances();
  const { data: followupsData, isLoading: loadingFollowups } = useFollowups();
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics();

  const instances = instancesData?.instances || [];
  const primaryInstance = instances[0];

  const followups = followupsData?.followups || [];
  const pendingFollowups = followups.filter((f) => f.status === "pending").length;
  const sentFollowups = followups.filter((f) => f.status === "sent" &&
    new Date(f.sent_at || f.created_at).toDateString() === new Date().toDateString()).length;

  const aiConversations = metrics?.revenueInProgress?.conversations || 0;
  const aiActions = 0; // TODO: Implementar contador de ações da IA
  const timeSaved = metrics?.timesSaved
    ? `${metrics.timesSaved.hours}h ${metrics.timesSaved.minutes}min`
    : "0h 0min";

  const isLoading = loadingInstances || loadingFollowups || loadingMetrics;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Inteligência Artificial"
        subtitle="Configure e monitore sua assistente virtual"
        actions={
          <Button onClick={() => navigate("/whatsapp-setup")} className="btn-gradient text-white">
            <Settings className="w-4 h-4" />
            Configurar WhatsApp
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Bot}
          title="Status da IA"
          value={primaryInstance?.status === "connected" ? "Ativa" : "Offline"}
          subtitle={primaryInstance?.status === "connected" ? "Funcionando 24/7" : "Configurar conexão"}
        />
        <StatCard
          icon={MessageSquare}
          title="Conversas Hoje"
          value={isLoading ? "-" : aiConversations}
          subtitle="Atendidas pela IA"
        />
        <StatCard
          icon={Zap}
          title="Ações Executadas"
          value={isLoading ? "-" : aiActions}
          subtitle="Últimas 24h"
        />
        <StatCard
          icon={Clock}
          title="Tempo Economizado"
          value={isLoading ? "-" : timeSaved}
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
            {loadingInstances ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
              </div>
            ) : !primaryInstance ? (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                <h4 className="font-semibold mb-2">Nenhuma instância configurada</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure sua primeira instância WhatsApp para começar
                </p>
                <Button onClick={() => navigate("/whatsapp-setup")} className="btn-gradient text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar WhatsApp
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${primaryInstance.status === 'connected' ? 'bg-green-500' : 'bg-gray-500'} flex items-center justify-center`}>
                      {primaryInstance.status === 'connected' ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{primaryInstance.name || 'Instância WhatsApp'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {primaryInstance.phone_number || 'Aguardando conexão'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={primaryInstance.status === 'connected' ? "default" : "secondary"} className={primaryInstance.status === 'connected' ? 'bg-green-500' : ''}>
                    {primaryInstance.status === 'connected' ? 'Online' : 'Offline'}
                  </Badge>
                </div>

                <div className="border-t border-border pt-6">
                  <h4 className="font-semibold mb-4">Personalidade da IA</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Nome da Atendente:</span>
                      <span className="font-medium">Aurora</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estilo:</span>
                      <span className="font-medium">Profissional e Acolhedora</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Idioma:</span>
                      <span className="font-medium">Português (BR)</span>
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
            )}
          </CardContent>
        </Card>

        {/* Follow-ups */}
        <Card className="col-span-4 glass-card">
          <CardHeader>
            <CardTitle>Follow-ups Automáticos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFollowups ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-ocean-blue animate-spin" />
              </div>
            ) : (
              <>
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

                {followups && followups.length > 0 ? (
                  <div className="space-y-3">
                    {followups.slice(0, 3).map((followup) => (
                      <div
                        key={followup.id}
                        className="p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-ocean-blue" />
                            <span className="text-sm font-medium">
                              {followup.followup_type === "appointment_reminder"
                                ? "Lembrete"
                                : followup.followup_type === "feedback"
                                ? "Feedback"
                                : "Follow-up"}
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
                          {followup.contact?.name || "Cliente"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">Nenhum follow-up agendado</p>
                  </div>
                )}

                <Button variant="outline" className="w-full mt-4">
                  Ver Todos os Follow-ups
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
