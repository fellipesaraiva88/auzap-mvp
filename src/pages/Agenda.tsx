import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, CheckCircle, Bot, User, Loader2 } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { format } from "date-fns";

export default function Agenda() {
  const [selectedDate] = useState(new Date());

  // Buscar agendamentos do dia selecionado
  const startDate = format(selectedDate, "yyyy-MM-dd");
  const endDate = format(selectedDate, "yyyy-MM-dd");

  const { bookings, isLoading } = useBookings({
    startDate,
    endDate,
  });

  const totalRevenue = bookings.reduce((sum, apt) => sum + (apt.price || 0), 0);
  const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;

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
          value={isLoading ? "-" : bookings.length}
          subtitle="Total do dia"
        />
        <StatCard
          icon={CheckCircle}
          title="Confirmados"
          value={isLoading ? "-" : confirmedBookings}
          subtitle="Aguardando atendimento"
        />
        <StatCard
          icon={DollarSign}
          title="Receita do Dia"
          value={isLoading ? "-" : `R$ ${totalRevenue.toFixed(2)}`}
          subtitle="Valor total"
        />
        <StatCard
          icon={Bot}
          title="Criados pela IA"
          value={isLoading ? "-" : bookings.filter(b => b.notes?.includes("IA")).length}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum agendamento</h3>
                <p className="text-muted-foreground">
                  Não há agendamentos para esta data
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const bookingDate = new Date(booking.scheduledFor);
                  const isAI = booking.notes?.includes("IA");

                  return (
                    <div
                      key={booking.id}
                      className="p-4 rounded-lg border border-border hover:border-ocean-blue/50 smooth-transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{booking.pet?.name || "Pet"}</h4>
                            {isAI ? (
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
                            Tutor: {booking.contact?.name || "Cliente"}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">
                            {booking.service}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-ocean-blue" />
                              {format(bookingDate, "HH:mm")}
                            </span>
                            {booking.price && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                R$ {booking.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={
                              booking.status === "confirmed"
                                ? "default"
                                : booking.status === "pending"
                                ? "secondary"
                                : booking.status === "completed"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {booking.status === "confirmed"
                              ? "Confirmado"
                              : booking.status === "pending"
                              ? "Agendado"
                              : booking.status === "completed"
                              ? "Concluído"
                              : "Cancelado"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Reagendar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
