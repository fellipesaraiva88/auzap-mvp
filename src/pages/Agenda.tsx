import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Clock, DollarSign, CheckCircle, Bot, User, Loader2 } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useContacts } from "@/hooks/useContacts";
import { usePets } from "@/hooks/usePets";
import { bookingsService } from "@/services/bookings.service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Agenda() {
  const { toast } = useToast();
  const [selectedDate] = useState(new Date());
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [newBooking, setNewBooking] = useState({
    contact_id: "",
    pet_id: "",
    service_id: "banho",
    scheduled_start: "",
    scheduled_end: "",
    notes: "",
  });

  const [rescheduleData, setRescheduleData] = useState({
    scheduled_start: "",
    scheduled_end: "",
  });

  // Buscar agendamentos do dia selecionado
  const startDate = format(selectedDate, "yyyy-MM-dd");
  const endDate = format(selectedDate, "yyyy-MM-dd");

  const { bookings, isLoading, refetch } = useBookings({
    startDate,
    endDate,
  });

  const { contacts } = useContacts();
  const selectedContact = contacts.find(c => c.id === newBooking.contact_id);
  const { pets: contactPets } = usePets(selectedContact?.id);

  const totalRevenue = bookings.reduce((sum, apt) => sum + (apt.price || 0), 0);
  const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;

  const handleCreateBooking = async () => {
    if (!newBooking.contact_id || !newBooking.scheduled_start || !newBooking.scheduled_end) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha cliente, data e horário",
      });
      return;
    }

    setIsCreating(true);
    try {
      await bookingsService.create(newBooking);

      toast({
        title: "✅ Agendamento criado!",
        description: "Serviço agendado com sucesso",
      });

      setNewBooking({
        contact_id: "",
        pet_id: "",
        service_id: "banho",
        scheduled_start: "",
        scheduled_end: "",
        notes: "",
      });
      setIsNewBookingOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar agendamento",
        description: error.response?.data?.error || "Tente novamente",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleData.scheduled_start || !rescheduleData.scheduled_end) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha data e horário",
      });
      return;
    }

    setIsRescheduling(true);
    try {
      await bookingsService.update(selectedBooking.id, rescheduleData);

      toast({
        title: "✅ Reagendado!",
        description: "Horário alterado com sucesso",
      });

      setIsRescheduleOpen(false);
      setSelectedBooking(null);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao reagendar",
        description: error.response?.data?.error || "Tente novamente",
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  const openReschedule = (booking: any) => {
    setSelectedBooking(booking);
    setRescheduleData({
      scheduled_start: booking.scheduled_start || "",
      scheduled_end: booking.scheduled_end || "",
    });
    setIsRescheduleOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Agenda"
        subtitle="Gerencie todos os agendamentos"
        actions={
          <Dialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient text-white">
                <Calendar className="w-4 h-4" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Agende um serviço para um cliente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">Cliente *</Label>
                  <Select
                    value={newBooking.contact_id}
                    onValueChange={(value) =>
                      setNewBooking({ ...newBooking, contact_id: value, pet_id: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedContact && (
                  <div className="space-y-2">
                    <Label htmlFor="pet">Pet (opcional)</Label>
                    <Select
                      value={newBooking.pet_id}
                      onValueChange={(value) =>
                        setNewBooking({ ...newBooking, pet_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um pet" />
                      </SelectTrigger>
                      <SelectContent>
                        {contactPets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.name} ({pet.species})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="service">Serviço *</Label>
                  <Select
                    value={newBooking.service_id}
                    onValueChange={(value) =>
                      setNewBooking({ ...newBooking, service_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banho">Banho</SelectItem>
                      <SelectItem value="tosa">Banho e Tosa</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="consulta">Consulta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Início *</Label>
                    <Input
                      id="start"
                      type="datetime-local"
                      value={newBooking.scheduled_start}
                      onChange={(e) =>
                        setNewBooking({ ...newBooking, scheduled_start: e.target.value })
                      }
                      disabled={isCreating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">Fim *</Label>
                    <Input
                      id="end"
                      type="datetime-local"
                      value={newBooking.scheduled_end}
                      onChange={(e) =>
                        setNewBooking({ ...newBooking, scheduled_end: e.target.value })
                      }
                      disabled={isCreating}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    placeholder="Ex: Cliente preferencial, pet nervoso..."
                    value={newBooking.notes}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, notes: e.target.value })
                    }
                    disabled={isCreating}
                  />
                </div>

                <Button
                  onClick={handleCreateBooking}
                  disabled={isCreating}
                  className="w-full btn-gradient text-white"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Criar Agendamento
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReschedule(booking)}
                          >
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

      {/* Dialog Reagendar */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar Serviço</DialogTitle>
            <DialogDescription>
              Altere a data e horário do agendamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedBooking && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium">{selectedBooking.pet?.name || "Pet"}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedBooking.contact?.full_name || "Cliente"} • {selectedBooking.service_type || "Serviço"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reschedule_start">Novo Início *</Label>
                <Input
                  id="reschedule_start"
                  type="datetime-local"
                  value={rescheduleData.scheduled_start}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, scheduled_start: e.target.value })
                  }
                  disabled={isRescheduling}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule_end">Novo Fim *</Label>
                <Input
                  id="reschedule_end"
                  type="datetime-local"
                  value={rescheduleData.scheduled_end}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, scheduled_end: e.target.value })
                  }
                  disabled={isRescheduling}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRescheduleOpen(false)}
                className="flex-1"
                disabled={isRescheduling}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={isRescheduling}
                className="flex-1 btn-gradient text-white"
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reagendando...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Reagendar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
