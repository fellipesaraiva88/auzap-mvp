import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { Pet, Contact } from '@/types';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { FormModal, FormField } from '@/components/FormModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

/*
 * Pets Page - Pet Management
 * Features:
 * - Real-time pet list with contact info
 * - DataTable with search, sort, and pagination
 * - Add/Edit pet modal with contact selection
 * - Delete confirmation
 * - Species filtering
 * - Pet history (bookings)
 */

interface PetWithContact extends Pet {
  contact?: Contact;
}

export default function Pets() {
  const { organization } = useAuthStore();

  // State management
  const [pets, setPets] = useState<PetWithContact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState({
    contact_id: '',
    name: '',
    species: 'dog' as Pet['species'],
    breed: '',
    birth_date: '',
    gender: 'unknown' as Pet['gender'],
  });

  // Load pets and contacts
  useEffect(() => {
    if (!organization?.id) return;

    loadData();
    setupRealtimeSubscription();
  }, [organization?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load contacts first
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', organization!.id)
        .eq('status', 'active')
        .order('name');

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);

      // Load pets
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .in('contact_id', contactsData?.map((c) => c.id) || [])
        .order('created_at', { ascending: false });

      if (petsError) throw petsError;

      // Combine pets with contact info
      const petsWithContacts: PetWithContact[] = (petsData || []).map((pet) => ({
        ...pet,
        contact: contactsData?.find((c) => c.id === pet.contact_id),
      }));

      setPets(petsWithContacts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('pets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets',
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  // CRUD operations
  const handleAdd = () => {
    setEditingPet(null);
    setFormData({
      contact_id: '',
      name: '',
      species: 'dog',
      breed: '',
      birth_date: '',
      gender: 'unknown',
    });
    setShowModal(true);
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      contact_id: pet.contact_id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      birth_date: pet.birth_date || '',
      gender: pet.gender || 'unknown',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingPet) {
        const { error } = await supabase
          .from('pets')
          .update({
            contact_id: formData.contact_id,
            name: formData.name,
            species: formData.species,
            breed: formData.breed || null,
            birth_date: formData.birth_date || null,
            gender: formData.gender,
          })
          .eq('id', editingPet.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('pets').insert({
          contact_id: formData.contact_id,
          name: formData.name,
          species: formData.species,
          breed: formData.breed || null,
          birth_date: formData.birth_date || null,
          gender: formData.gender,
        });

        if (error) throw error;
      }

      setShowModal(false);
    } catch (error) {
      console.error('Error saving pet:', error);
      alert('Erro ao salvar pet');
    }
  };

  const handleDelete = async (pet: Pet) => {
    if (!confirm(`Tem certeza que deseja excluir ${pet.name}?`)) return;

    try {
      const { error } = await supabase.from('pets').delete().eq('id', pet.id);

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
      other: '🐾',
    };
    return emojis[species];
  };

  const getSpeciesLabel = (species: Pet['species']) => {
    const labels = {
      dog: 'Cachorro',
      cat: 'Gato',
      bird: 'Pássaro',
      rabbit: 'Coelho',
      other: 'Outro',
    };
    return labels[species];
  };

  const getGenderLabel = (gender?: Pet['gender']) => {
    if (!gender || gender === 'unknown') return 'Não informado';
    return gender === 'male' ? 'Macho' : 'Fêmea';
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();

    if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  };

  // Stats
  const stats = useMemo(() => {
    const bySpecies = pets.reduce((acc, pet) => {
      acc[pet.species] = (acc[pet.species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: pets.length,
      bySpecies,
    };
  }, [pets]);

  // Table columns
  const columns: DataTableColumn<PetWithContact>[] = [
    {
      key: 'name',
      label: 'Pet',
      sortable: true,
      render: (pet) => (
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getSpeciesEmoji(pet.species)}</span>
          <div>
            <div className="font-medium text-gray-900">{pet.name}</div>
            <div className="text-sm text-gray-500">{getSpeciesLabel(pet.species)}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact_id',
      label: 'Tutor',
      sortable: true,
      render: (pet) => (
        <div>
          <div className="text-gray-900">{pet.contact?.name || 'Sem nome'}</div>
          <div className="text-sm text-gray-500">{pet.contact?.phone}</div>
        </div>
      ),
    },
    {
      key: 'breed',
      label: 'Raça',
      render: (pet) => pet.breed || '-',
    },
    {
      key: 'gender',
      label: 'Sexo',
      render: (pet) => getGenderLabel(pet.gender),
    },
    {
      key: 'birth_date',
      label: 'Idade',
      render: (pet) => {
        const age = calculateAge(pet.birth_date);
        return age || '-';
      },
    },
    {
      key: 'created_at',
      label: 'Cadastrado em',
      sortable: true,
      render: (pet) => new Date(pet.created_at).toLocaleDateString('pt-BR'),
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'text-right',
      render: (pet) => (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => handleEdit(pet)}>
            Editar
          </Button>
          <Button variant="destructive" onClick={() => handleDelete(pet)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🐾</div>
          <div className="text-gray-600">Carregando pets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pets</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gerencie todos os pets cadastrados
              </p>
            </div>
            <Button onClick={handleAdd}>+ Novo Pet</Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total de Pets</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
          </div>
          {(['dog', 'cat', 'bird', 'rabbit'] as const).map((species) => (
            <div key={species} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl mb-1">{getSpeciesEmoji(species)}</div>
              <div className="text-sm text-gray-500">{getSpeciesLabel(species)}</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {stats.bySpecies[species] || 0}
              </div>
            </div>
          ))}
        </div>

        {/* Pets Table */}
        <DataTable
          data={pets}
          columns={columns}
          searchKeys={['name', 'breed']}
          searchPlaceholder="Buscar por nome ou raça..."
          pageSize={10}
          emptyMessage="Nenhum pet encontrado. Comece adicionando o primeiro pet!"
        />
      </div>

      {/* Pet Modal */}
      <FormModal
        open={showModal}
        onOpenChange={setShowModal}
        title={editingPet ? 'Editar Pet' : 'Novo Pet'}
        description="Preencha as informações do pet"
        onSubmit={handleSubmit}
        submitLabel={editingPet ? 'Atualizar' : 'Criar'}
        submitDisabled={!formData.contact_id || !formData.name}
      >
        <FormField
          label="Tutor (Contato)"
          name="contact_id"
          type="select"
          value={formData.contact_id}
          onChange={(value) => setFormData({ ...formData, contact_id: value })}
          required
          options={contacts.map((c) => ({
            value: c.id,
            label: `${c.name || c.phone} - ${c.phone}`,
          }))}
        />

        <FormField
          label="Nome do Pet"
          name="name"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          placeholder="Ex: Rex, Mimi, Bob"
          required
        />

        <FormField
          label="Espécie"
          name="species"
          type="select"
          value={formData.species}
          onChange={(value) => setFormData({ ...formData, species: value as Pet['species'] })}
          required
          options={[
            { value: 'dog', label: '🐕 Cachorro' },
            { value: 'cat', label: '🐈 Gato' },
            { value: 'bird', label: '🐦 Pássaro' },
            { value: 'rabbit', label: '🐰 Coelho' },
            { value: 'other', label: '🐾 Outro' },
          ]}
        />

        <FormField
          label="Raça"
          name="breed"
          value={formData.breed}
          onChange={(value) => setFormData({ ...formData, breed: value })}
          placeholder="Ex: Golden Retriever, Persa, etc."
        />

        <FormField
          label="Data de Nascimento"
          name="birth_date"
          type="date"
          value={formData.birth_date}
          onChange={(value) => setFormData({ ...formData, birth_date: value })}
        />

        <FormField
          label="Sexo"
          name="gender"
          type="select"
          value={formData.gender}
          onChange={(value) => setFormData({ ...formData, gender: value as Pet['gender'] })}
          options={[
            { value: 'unknown', label: 'Não informado' },
            { value: 'male', label: 'Macho' },
            { value: 'female', label: 'Fêmea' },
          ]}
        />
      </FormModal>
    </div>
  );
}
