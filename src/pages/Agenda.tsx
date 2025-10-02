import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, CheckCircle, Bot, User } from "lucide-react";
import { mockAppointments } from "@/data/mockData";

export default function Agenda() {
  const [selectedDate] = useState(new Date());

  const todayAppointments = mockAppointments.filter(
    (apt) => apt.date === "2025-10-02"
  );

  const totalRevenue = todayAppointments.reduce((sum, apt) => sum + apt.price, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Agenda"
        subtitle="Gerencie todos os agendamentos"
        actions={
          <Button>
            <Calendar className="w-4 h-4" />
            Novo Agendamento
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Calendar}
          title="Agendamentos Hoje"
          value={todayAppointments.length}
          subtitle="Total do dia"
        />
        <StatCard
          icon={CheckCircle}
          title="Confirmados"
          value={todayAppointments.filter((a) => a.status === "confirmed").length}
          subtitle="Aguardando atendimento"
        />
        <StatCard
          icon={DollarSign}
          title="Receita do Dia"
          value={`R$ ${totalRevenue}`}
          subtitle="Valor total"
        />
        <StatCard
          icon={Bot}
          title="Criados pela IA"
          value={todayAppointments.filter((a) => a.createdBy === "ai").length}
          subtitle="Automáticos"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Calendário */}
        <Card className="col-span-4 glass-card">
          <CardHeader>
            <CardTitle>Outubro 2025</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  className={`aspect-square rounded-lg text-sm smooth-transition ${
                    day === selectedDate.getDate()
                      ? "bg-ocean-blue text-white"
                      : "hover:bg-muted"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Agendamentos */}
        <Card className="col-span-8 glass-card">
          <CardHeader>
            <CardTitle>Agendamentos de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 rounded-lg border border-border hover:border-ocean-blue/50 smooth-transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{appointment.petName}</h4>
                        {appointment.createdBy === "ai" ? (
                          <Badge variant="secondary" className="gap-1">
                            <Bot className="w-3 h-3" />
                            IA
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <User className="w-3 h-3" />
                            Manual
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Tutor: {appointment.ownerName}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {appointment.service}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-ocean-blue" />
                          {appointment.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          R$ {appointment.price}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          appointment.status === "confirmed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {appointment.status === "confirmed"
                          ? "Confirmado"
                          : "Agendado"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Reagendar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
