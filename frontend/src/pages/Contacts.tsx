import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { Contact } from '@/types';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { FormModal, FormField } from '@/components/FormModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

/*
 * Contacts Page - Contact Management
 * Features:
 * - Real-time contact list with Supabase subscriptions
 * - DataTable with search, sort, and pagination
 * - Add/Edit contact modal
 * - Delete confirmation
 * - Status management
 * - Responsive design
 */

export default function Contacts() {
  const { organization } = useAuthStore();

  // State management
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'active' as Contact['status'],
  });

  // Load contacts
  useEffect(() => {
    if (!organization?.id) return;

    loadContacts();
    setupRealtimeSubscription();
  }, [organization?.id]);

  const loadContacts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `organization_id=eq.${organization!.id}`,
        },
        () => {
          loadContacts();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  // CRUD operations
  const handleAdd = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      phone: contact.phone,
      email: contact.email || '',
      status: contact.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            status: formData.status,
          })
          .eq('id', editingContact.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert({
            organization_id: organization!.id,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            status: formData.status,
            total_bookings: 0,
          });

        if (error) throw error;
      }

      setShowModal(false);
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Erro ao salvar contato');
    }
  };

  const handleDelete = async (contact: Contact) => {
    if (!confirm(`Tem certeza que deseja excluir ${contact.name || contact.phone}?`)) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Erro ao excluir contato');
    }
  };

  // Table columns
  const columns: DataTableColumn<Contact>[] = [
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
      render: (contact) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {contact.name?.charAt(0).toUpperCase() || contact.phone.charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {contact.name || 'Sem nome'}
            </div>
            <div className="text-sm text-gray-500">
              Cliente desde {new Date(contact.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Telefone',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      render: (contact) => contact.email || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (contact) => {
        const variants: Record<Contact['status'], 'success' | 'secondary' | 'destructive'> = {
          active: 'success',
          inactive: 'secondary',
          blocked: 'destructive',
        };
        const labels: Record<Contact['status'], string> = {
          active: 'Ativo',
          inactive: 'Inativo',
          blocked: 'Bloqueado',
        };
        return <Badge variant={variants[contact.status]}>{labels[contact.status]}</Badge>;
      },
    },
    {
      key: 'total_bookings',
      label: 'Agendamentos',
      sortable: true,
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'text-right',
      render: (contact) => (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => handleEdit(contact)}>
            Editar
          </Button>
          <Button variant="destructive" onClick={() => handleDelete(contact)}>
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
          <div className="text-gray-600">Carregando contatos...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gerencie os contatos da sua organização
              </p>
            </div>
            <Button onClick={handleAdd}>+ Novo Contato</Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total de Contatos</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{contacts.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Contatos Ativos</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {contacts.filter((c) => c.status === 'active').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Total de Agendamentos</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {contacts.reduce((sum, c) => sum + c.total_bookings, 0)}
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <DataTable
          data={contacts}
          columns={columns}
          searchKeys={['name', 'phone', 'email']}
          searchPlaceholder="Buscar por nome, telefone ou email..."
          pageSize={10}
          emptyMessage="Nenhum contato encontrado. Comece adicionando seu primeiro contato!"
        />
      </div>

      {/* Contact Modal */}
      <FormModal
        open={showModal}
        onOpenChange={setShowModal}
        title={editingContact ? 'Editar Contato' : 'Novo Contato'}
        description="Preencha as informações do contato"
        onSubmit={handleSubmit}
        submitLabel={editingContact ? 'Atualizar' : 'Criar'}
        submitDisabled={!formData.phone}
      >
        <FormField
          label="Nome"
          name="name"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          placeholder="Nome do contato"
        />

        <FormField
          label="Telefone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={(value) => setFormData({ ...formData, phone: value })}
          placeholder="(00) 00000-0000"
          required
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
          placeholder="email@exemplo.com"
        />

        <FormField
          label="Status"
          name="status"
          type="select"
          value={formData.status}
          onChange={(value) => setFormData({ ...formData, status: value as Contact['status'] })}
          options={[
            { value: 'active', label: 'Ativo' },
            { value: 'inactive', label: 'Inativo' },
            { value: 'blocked', label: 'Bloqueado' },
          ]}
        />
      </FormModal>
    </div>
  );
}
