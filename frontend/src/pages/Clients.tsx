import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { Contact, Pet } from '@/types';

/*
 * Clients Page - Contact and Pet Management
 * Features:
 * - Real-time contact list with Supabase subscriptions
 * - Search and filter capabilities
 * - Pet management per contact
 * - Add/Edit contact and pet modals
 * - Responsive design with Tailwind CSS
 */

interface ContactWithPets extends Contact {
  pets?: Pet[];
}

type FormMode = 'add' | 'edit';
type ModalType = 'contact' | 'pet' | null;

export default function Clients() {
  const { organization } = useAuthStore();

  // State management
  const [contacts, setContacts] = useState<ContactWithPets[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Contact['status'] | 'all'>('all');
  const [selectedContact, setSelectedContact] = useState<ContactWithPets | null>(null);
  const [showModal, setShowModal] = useState<ModalType>(null);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'active' as Contact['status']
  });

  // Pet form state
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'dog' as Pet['species'],
    breed: '',
    birth_date: '',
    gender: 'unknown' as Pet['gender']
  });

  // Load contacts with pets
  useEffect(() => {
    if (!organization?.id) return;

    loadContacts();
    setupRealtimeSubscription();
  }, [organization?.id]);

  const loadContacts = async () => {
    try {
      setLoading(true);

      // Load contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;

      // Load pets for all contacts
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .in('contact_id', contactsData?.map(c => c.id) || []);

      if (petsError) throw petsError;

      // Combine contacts with their pets
      const contactsWithPets: ContactWithPets[] = (contactsData || []).map(contact => ({
        ...contact,
        pets: petsData?.filter(pet => pet.contact_id === contact.id) || []
      }));

      setContacts(contactsWithPets);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to contacts changes
    const contactsChannel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `organization_id=eq.${organization!.id}`
        },
        () => {
          loadContacts();
        }
      )
      .subscribe();

    // Subscribe to pets changes
    const petsChannel = supabase
      .channel('pets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets'
        },
        () => {
          loadContacts();
        }
      )
      .subscribe();

    return () => {
      contactsChannel.unsubscribe();
      petsChannel.unsubscribe();
    };
  };

  // Filtered contacts based on search and status
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch =
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contacts, searchTerm, statusFilter]);

  // Contact CRUD operations
  const handleAddContact = () => {
    setFormMode('add');
    setContactForm({
      name: '',
      phone: '',
      email: '',
      status: 'active'
    });
    setShowModal('contact');
  };

  const handleEditContact = (contact: ContactWithPets) => {
    setFormMode('edit');
    setSelectedContact(contact);
    setContactForm({
      name: contact.name || '',
      phone: contact.phone,
      email: contact.email || '',
      status: contact.status
    });
    setShowModal('contact');
  };

  const handleSaveContact = async () => {
    try {
      if (formMode === 'add') {
        const { error } = await supabase
          .from('contacts')
          .insert({
            organization_id: organization!.id,
            name: contactForm.name,
            phone: contactForm.phone,
            email: contactForm.email,
            status: contactForm.status,
            total_bookings: 0
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .update({
            name: contactForm.name,
            phone: contactForm.phone,
            email: contactForm.email,
            status: contactForm.status
          })
          .eq('id', selectedContact!.id);

        if (error) throw error;
      }

      setShowModal(null);
      setSelectedContact(null);
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Erro ao salvar contato');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Erro ao excluir contato');
    }
  };

  // Pet CRUD operations
  const handleAddPet = (contact: ContactWithPets) => {
    setFormMode('add');
    setSelectedContact(contact);
    setPetForm({
      name: '',
      species: 'dog',
      breed: '',
      birth_date: '',
      gender: 'unknown'
    });
    setShowModal('pet');
  };

  const handleEditPet = (contact: ContactWithPets, pet: Pet) => {
    setFormMode('edit');
    setSelectedContact(contact);
    setSelectedPet(pet);
    setPetForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      birth_date: pet.birth_date || '',
      gender: pet.gender || 'unknown'
    });
    setShowModal('pet');
  };

  const handleSavePet = async () => {
    try {
      if (formMode === 'add') {
        const { error } = await supabase
          .from('pets')
          .insert({
            contact_id: selectedContact!.id,
            name: petForm.name,
            species: petForm.species,
            breed: petForm.breed || null,
            birth_date: petForm.birth_date || null,
            gender: petForm.gender
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pets')
          .update({
            name: petForm.name,
            species: petForm.species,
            breed: petForm.breed || null,
            birth_date: petForm.birth_date || null,
            gender: petForm.gender
          })
          .eq('id', selectedPet!.id);

        if (error) throw error;
      }

      setShowModal(null);
      setSelectedContact(null);
      setSelectedPet(null);
    } catch (error) {
      console.error('Error saving pet:', error);
      alert('Erro ao salvar pet');
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pet?')) return;

    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting pet:', error);
      alert('Erro ao excluir pet');
    }
  };

  // Helper functions
  const getSpeciesEmoji = (species: Pet['species']) => {
    const emojis = {
      dog: '🐕',
      cat: '🐈',
      bird: '🐦',
      rabbit: '🐰',
      other: '🐾'
    };
    return emojis[species];
  };

  const getStatusColor = (status: Contact['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      blocked: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getStatusLabel = (status: Contact['status']) => {
    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      blocked: 'Bloqueado'
    };
    return labels[status];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🐾</div>
          <div className="text-gray-600">Carregando clientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gerencie seus clientes e seus pets
              </p>
            </div>
            <button
              onClick={handleAddContact}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Novo Cliente
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Contact['status'] | 'all')}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total de Clientes</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{contacts.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Clientes Ativos</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {contacts.filter(c => c.status === 'active').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total de Pets</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {contacts.reduce((sum, c) => sum + (c.pets?.length || 0), 0)}
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando seu primeiro cliente'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agendamentos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredContacts.map((contact) => (
                    <>
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {contact.name?.charAt(0).toUpperCase() || contact.phone.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {contact.name || 'Sem nome'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Cliente desde {new Date(contact.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contact.phone}</div>
                          {contact.email && (
                            <div className="text-sm text-gray-500">{contact.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(contact.status)}`}>
                            {getStatusLabel(contact.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setExpandedContact(expandedContact === contact.id ? null : contact.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {contact.pets?.length || 0} pet{contact.pets?.length !== 1 ? 's' : ''}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contact.total_bookings}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleAddPet(contact)}
                            className="text-green-600 hover:text-green-900 mr-3"
                            title="Adicionar Pet"
                          >
                            + Pet
                          </button>
                          <button
                            onClick={() => handleEditContact(contact)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                      {/* Pets expanded section */}
                      {expandedContact === contact.id && contact.pets && contact.pets.length > 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Pets:</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {contact.pets.map((pet) => (
                                  <div
                                    key={pet.id}
                                    className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-2xl">{getSpeciesEmoji(pet.species)}</span>
                                        <div>
                                          <div className="font-medium text-gray-900">{pet.name}</div>
                                          <div className="text-xs text-gray-500">
                                            {pet.breed || pet.species}
                                            {pet.gender && ` • ${pet.gender === 'male' ? 'Macho' : pet.gender === 'female' ? 'Fêmea' : ''}`}
                                          </div>
                                          {pet.birth_date && (
                                            <div className="text-xs text-gray-500">
                                              Nascimento: {new Date(pet.birth_date).toLocaleDateString()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleEditPet(contact, pet)}
                                          className="text-blue-600 hover:text-blue-800 text-xs"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          onClick={() => handleDeletePet(pet.id)}
                                          className="text-red-600 hover:text-red-800 text-xs"
                                        >
                                          Excluir
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      {showModal === 'contact' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {formMode === 'add' ? 'Novo Cliente' : 'Editar Cliente'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={contactForm.status}
                  onChange={(e) => setContactForm({ ...contactForm, status: e.target.value as Contact['status'] })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveContact}
                disabled={!contactForm.phone}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pet Modal */}
      {showModal === 'pet' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {formMode === 'add' ? 'Novo Pet' : 'Editar Pet'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={petForm.name}
                  onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do pet"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Espécie *
                </label>
                <select
                  value={petForm.species}
                  onChange={(e) => setPetForm({ ...petForm, species: e.target.value as Pet['species'] })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dog">Cachorro</option>
                  <option value="cat">Gato</option>
                  <option value="bird">Pássaro</option>
                  <option value="rabbit">Coelho</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raça
                </label>
                <input
                  type="text"
                  value={petForm.breed}
                  onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Golden Retriever"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={petForm.birth_date}
                  onChange={(e) => setPetForm({ ...petForm, birth_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo
                </label>
                <select
                  value={petForm.gender}
                  onChange={(e) => setPetForm({ ...petForm, gender: e.target.value as Pet['gender'] })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unknown">Não informado</option>
                  <option value="male">Macho</option>
                  <option value="female">Fêmea</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePet}
                disabled={!petForm.name}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
