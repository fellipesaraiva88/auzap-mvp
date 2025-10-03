import { useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "pt-BR": ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
}

interface CalendarViewProps {
  bookings: any[];
  onSelectEvent: (event: CalendarEvent) => void;
  onEventDrop: (event: { event: CalendarEvent; start: Date; end: Date }) => void;
  defaultView?: View;
}

export function CalendarView({
  bookings,
  onSelectEvent,
  onEventDrop,
  defaultView = "month",
}: CalendarViewProps) {
  // Converter bookings para eventos do calendário
  const events = useMemo<CalendarEvent[]>(() => {
    return bookings.map((booking) => {
      const start = new Date(booking.scheduled_start || booking.scheduledFor);
      const end = new Date(booking.scheduled_end || start);

      // Título com nome do pet e serviço
      const petName = booking.pet?.name || "Pet";
      const clientName = booking.contact?.full_name || booking.contact?.name || "Cliente";
      const service = booking.service_type?.replace("_", " ").toUpperCase() || booking.service || "Serviço";

      return {
        id: booking.id,
        title: `${petName} - ${service}`,
        start,
        end,
        resource: {
          ...booking,
          clientName,
        },
      };
    });
  }, [bookings]);

  // Estilizar eventos baseado no status
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = "#3b82f6"; // default: blue
    let borderColor = "#2563eb";

    switch (status) {
      case "confirmed":
        backgroundColor = "#3b82f6"; // blue
        borderColor = "#2563eb";
        break;
      case "pending":
        backgroundColor = "#f59e0b"; // amber
        borderColor = "#d97706";
        break;
      case "completed":
        backgroundColor = "#10b981"; // green
        borderColor = "#059669";
        break;
      case "cancelled":
        backgroundColor = "#ef4444"; // red
        borderColor = "#dc2626";
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "6px",
        opacity: status === "cancelled" ? 0.6 : 1,
        color: "white",
        fontSize: "0.875rem",
        padding: "4px 8px",
        cursor: "pointer",
      },
    };
  }, []);

  // Handler para drag-and-drop
  const handleEventDrop = useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
      onEventDrop({ event, start, end });
    },
    [onEventDrop]
  );

  // Mensagens em português
  const messages = {
    allDay: "Dia todo",
    previous: "Anterior",
    next: "Próximo",
    today: "Hoje",
    month: "Mês",
    week: "Semana",
    day: "Dia",
    agenda: "Agenda",
    date: "Data",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "Nenhum agendamento neste período",
    showMore: (total: number) => `+ (${total}) mais`,
  };

  return (
    <div className="calendar-container" style={{ height: "600px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={defaultView}
        views={["month", "week", "agenda"]}
        messages={messages}
        culture="pt-BR"
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventStyleGetter}
        onEventDrop={handleEventDrop}
        draggableAccessor={() => true}
        resizable
        style={{ height: "100%" }}
        popup
      />
    </div>
  );
}
