import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Calendar as CalendarIcon, Clock, DollarSign, CheckCircle, Bot, User, Loader2 } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useContacts } from "@/hooks/useContacts";
import { usePets } from "@/hooks/usePets";
import { bookingsService } from "@/services/bookings.service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarView } from "@/components/CalendarView";

export default function Agenda() {
  const { toast } = useToast();
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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

  // Buscar todos os bookings (sem filtro de data para mostrar no calendário)
  const { bookings, isLoading, refetch } = useBookings({});

  const { contacts } = useContacts();
  const selectedContact = contacts.find(c => c.id === newBooking.contact_id);
  const { pets: contactPets } = usePets(selectedContact?.id);

  // Filtrar bookings de hoje para stats
  const today = format(new Date(), "yyyy-MM-dd");
  const todayBookings = bookings.filter((b) => {
    const bookingDate = format(new Date(b.scheduled_start || b.scheduledFor), "yyyy-MM-dd");
    return bookingDate === today;
  });

  const totalRevenue = todayBookings.reduce((sum, apt) => sum + (apt.price || 0), 0);
  const confirmedBookings = todayBookings.filter(b => b.status === "confirmed").length;
  const aiBookings = todayBookings.filter(b => b.notes?.includes("IA") || b.created_by_ai).length;

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

  // Handler para quando um evento é clicado
  const handleSelectEvent = (event: any) => {
    setSelectedBooking(event.resource);
    setIsDetailsOpen(true);
  };

  // Handler para drag-and-drop de eventos
  const handleEventDrop = async ({ event, start, end }: any) => {
    setIsRescheduling(true);
    try {
      await bookingsService.update(event.id, {
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
      });

      toast({
        title: "✅ Reagendado!",
        description: "Horário alterado com sucesso",
      });

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

  const handleReschedule = async (newStart: string, newEnd: string) => {
    if (!selectedBooking) return;

    setIsRescheduling(true);
    try {
      await bookingsService.update(selectedBooking.id, {
        scheduled_start: newStart,
        scheduled_end: newEnd,
      });

      toast({
        title: "✅ Reagendado!",
        description: "Horário alterado com sucesso",
      });

      setIsDetailsOpen(false);
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Agenda"
        subtitle="Gerencie todos os agendamentos"
        actions={
          <Dialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient text-white">
                <CalendarIcon className="w-4 h-4" />
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
          icon={CalendarIcon}
          title="Agendamentos Hoje"
          value={isLoading ? "-" : todayBookings.length}
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
          value={isLoading ? "-" : aiBookings}
          subtitle="Automáticos"
        />
      </div>

      {/* Calendário Visual Completo */}
      <Card className="glass-card">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
            </div>
          ) : (
            <CalendarView
              bookings={bookings}
              onSelectEvent={handleSelectEvent}
              onEventDrop={handleEventDrop}
              defaultView="month"
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog Detalhes do Agendamento */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Informações completas do serviço agendado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedBooking && (
              <>
                {/* Info do Agendamento */}
                <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">{selectedBooking.pet?.name || "Pet"}</h4>
                    {selectedBooking.notes?.includes("IA") || selectedBooking.created_by_ai ? (
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

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cliente</p>
                      <p className="font-medium">{selectedBooking.clientName || "Cliente"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Serviço</p>
                      <p className="font-medium">
                        {selectedBooking.service_type?.replace("_", " ").toUpperCase() || "Serviço"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.scheduled_start || selectedBooking.scheduledFor), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Horário</p>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.scheduled_start || selectedBooking.scheduledFor), "HH:mm")}
                        {selectedBooking.scheduled_end &&
                          ` - ${format(new Date(selectedBooking.scheduled_end), "HH:mm")}`
                        }
                      </p>
                    </div>
                    {selectedBooking.price && (
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className="font-medium text-green-600">R$ {selectedBooking.price.toFixed(2)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge
                        variant={
                          selectedBooking.status === "confirmed"
                            ? "default"
                            : selectedBooking.status === "pending"
                            ? "secondary"
                            : selectedBooking.status === "completed"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {selectedBooking.status === "confirmed"
                          ? "Confirmado"
                          : selectedBooking.status === "pending"
                          ? "Agendado"
                          : selectedBooking.status === "completed"
                          ? "Concluído"
                          : "Cancelado"}
                      </Badge>
                    </div>
                  </div>

                  {selectedBooking.notes && (
                    <div>
                      <p className="text-muted-foreground text-sm">Observações</p>
                      <p className="text-sm">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
