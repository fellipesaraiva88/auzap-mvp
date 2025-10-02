import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import type { Booking, Contact, Pet } from '@/types';

// Extended Booking type with relations
interface BookingWithRelations extends Booking {
  contact?: Contact;
  pet?: { id: string; name: string; species: string };
  service?: { id: string; name: string; service_type: string };
}

// Service type for creating bookings
interface Service {
  id: string;
  name: string;
  service_type: string;
  duration_minutes: number;
  price: number;
}

export default function Bookings() {
  const { organization } = useAuthStore();

  // State
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  // New booking form
  const [newBooking, setNewBooking] = useState({
    contact_id: '',
    pet_id: '',
    service_id: '',
    scheduled_date: '',
    duration_minutes: 60,
    notes: '',
  });

  // Fetch bookings from Supabase
  const fetchBookings = async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      let query = supabase
        .from('bookings')
        .select(`
          *,
          contact:contacts(id, name, phone),
          pet:pets(id, name, species),
          service:services(id, name, service_type)
        `)
        .eq('organization_id', organization.id)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contacts and pets for dropdown
  const fetchContactsAndPets = async () => {
    if (!organization?.id) return;

    try {
      const [contactsRes, petsRes, servicesRes] = await Promise.all([
        supabase
          .from('contacts')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('status', 'active')
          .order('name'),
        supabase
          .from('pets')
          .select('*')
          .order('name'),
        supabase
          .from('services')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('is_active', true)
          .order('name'),
      ]);

      if (contactsRes.data) setContacts(contactsRes.data);
      if (petsRes.data) setPets(petsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!organization?.id) return;

    fetchBookings();
    fetchContactsAndPets();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `organization_id=eq.${organization.id}`,
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, selectedDate, statusFilter]);

  // Create new booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;

    try {
      const selectedService = services.find(s => s.id === newBooking.service_id);

      const scheduledDate = new Date(newBooking.scheduled_date);
      const endTime = new Date(scheduledDate.getTime() + (newBooking.duration_minutes || 60) * 60000);

      const { error } = await supabase
        .from('bookings')
        .insert({
          organization_id: organization.id,
          contact_id: newBooking.contact_id,
          pet_id: newBooking.pet_id || null,
          service_id: newBooking.service_id || null,
          booking_type: 'appointment',
          status: 'scheduled',
          start_time: scheduledDate.toISOString(),
          end_time: endTime.toISOString(),
          price: selectedService?.price || 0,
          paid: false,
        });

      if (error) throw error;

      setShowCreateModal(false);
      setNewBooking({
        contact_id: '',
        pet_id: '',
        service_id: '',
        scheduled_date: '',
        duration_minutes: 60,
        notes: '',
      });

      fetchBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Erro ao criar agendamento');
    }
  };

  // Update booking status
  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    await handleUpdateStatus(bookingId, 'cancelled');
  };

  // Calendar navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  // Filter pets by selected contact
  const filteredPets = useMemo(() => {
    if (!newBooking.contact_id) return [];
    return pets.filter(pet => {
      const contact = contacts.find(c => c.id === newBooking.contact_id);
      return pet.contact_id === contact?.id;
    });
  }, [newBooking.contact_id, pets, contacts]);

  // Stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const revenue = bookings
      .filter(b => b.status === 'completed' && b.paid)
      .reduce((sum, b) => sum + (b.price || 0), 0);

    return { total, confirmed, completed, revenue };
  }, [bookings]);

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status colors
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Status labels
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Não Compareceu',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
              <p className="text-sm text-gray-500">{organization?.name}</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + Novo Agendamento
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total do Dia</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
            <div className="text-xs text-gray-600 mt-1">agendamentos</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Confirmados</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{stats.confirmed}</div>
            <div className="text-xs text-gray-600 mt-1">prontos para atender</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Concluídos</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.completed}</div>
            <div className="text-xs text-gray-600 mt-1">serviços realizados</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Receita</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              R$ {stats.revenue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600 mt-1">recebido hoje</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Calendário</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1 text-xs rounded ${
                      viewMode === 'day' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Dia
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1 text-xs rounded ${
                      viewMode === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Semana
                  </button>
                </div>
              </div>

              {/* Date Navigator */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  ←
                </button>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedDate.toLocaleDateString('pt-BR', { year: 'numeric' })}
                  </div>
                </div>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  →
                </button>
              </div>

              <button
                onClick={() => setSelectedDate(new Date())}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Hoje
              </button>

              {/* Filters */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="scheduled">Agendado</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="no_show">Não Compareceu</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Agendamentos - {formatDate(selectedDate)}
                </h2>
              </div>

              <div className="p-4">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum agendamento para este dia
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">
                              {booking.pet?.species === 'dog' ? '🐕' :
                               booking.pet?.species === 'cat' ? '🐱' : '🐾'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {booking.contact?.name || 'Cliente não informado'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {booking.pet?.name || 'Pet não informado'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>

                        {booking.service && (
                          <div className="text-sm text-gray-600 mb-3">
                            Serviço: {booking.service.name}
                          </div>
                        )}

                        {booking.price && (
                          <div className="text-sm font-medium text-gray-900 mb-3">
                            Valor: R$ {booking.price.toFixed(2)}
                            {booking.paid && (
                              <span className="ml-2 text-green-600 text-xs">✓ Pago</span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t">
                          {booking.status === 'scheduled' && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                            >
                              Confirmar
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'in_progress')}
                              className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200"
                            >
                              Iniciar
                            </button>
                          )}
                          {booking.status === 'in_progress' && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'completed')}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                            >
                              Concluir
                            </button>
                          )}
                          {!['completed', 'cancelled'].includes(booking.status) && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Novo Agendamento</h2>

              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    required
                    value={newBooking.contact_id}
                    onChange={(e) => setNewBooking({ ...newBooking, contact_id: e.target.value, pet_id: '' })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione o cliente</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} - {contact.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pet
                  </label>
                  <select
                    value={newBooking.pet_id}
                    onChange={(e) => setNewBooking({ ...newBooking, pet_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!newBooking.contact_id}
                  >
                    <option value="">Selecione o pet</option>
                    {filteredPets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} ({pet.species})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serviço *
                  </label>
                  <select
                    required
                    value={newBooking.service_id}
                    onChange={(e) => {
                      const service = services.find(s => s.id === e.target.value);
                      setNewBooking({
                        ...newBooking,
                        service_id: e.target.value,
                        duration_minutes: service?.duration_minutes || 60,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione o serviço</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - R$ {service.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data e Hora *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newBooking.scheduled_date}
                    onChange={(e) => setNewBooking({ ...newBooking, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    value={newBooking.duration_minutes}
                    onChange={(e) => setNewBooking({ ...newBooking, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Criar Agendamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
