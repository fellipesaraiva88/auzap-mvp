import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, UserPlus, Dog, Cat, Bot, Loader2 } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { usePets } from "@/hooks/usePets";
import { contactsService } from "@/services/contacts.service";
import { useToast } from "@/hooks/use-toast";

// Componente interno para buscar pets de um cliente
function ClientPets({ contactId }: { contactId: string }) {
  const { pets, isLoading } = usePets(contactId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-6 h-6 text-ocean-blue animate-spin" />
      </div>
    );
  }

  if (!pets || pets.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum pet cadastrado</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {pets.map((pet: any) => (
        <div key={pet.id} className="p-3 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            {pet.species === "dog" ? (
              <Dog className="w-4 h-4 text-ocean-blue" />
            ) : (
              <Cat className="w-4 h-4 text-ocean-blue" />
            )}
            <span className="font-medium">{pet.name}</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Raça: {pet.breed || "Não informado"}</p>
            <p>Idade: {pet.age || pet.age_years || 0} anos</p>
            {pet.weight_kg && <p>Peso: {pet.weight_kg} kg</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Clientes() {
  const [searchQuery, setSearchQuery] = useState("");
  const { contacts, total, isLoading, refetch } = useContacts(searchQuery);
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newContact, setNewContact] = useState({
    phone_number: "",
    full_name: "",
    email: "",
  });

  const handleCreateContact = async () => {
    if (!newContact.phone_number || !newContact.full_name) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha nome e telefone do cliente",
      });
      return;
    }

    setIsCreating(true);
    try {
      await contactsService.create({
        phone_number: newContact.phone_number,
        full_name: newContact.full_name,
        email: newContact.email || undefined,
      });

      toast({
        title: "✅ Cliente criado!",
        description: `${newContact.full_name} foi adicionado com sucesso`,
      });

      setNewContact({ phone_number: "", full_name: "", email: "" });
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar cliente",
        description: error.response?.data?.error || "Tente novamente",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Calcular estatísticas básicas
  const totalPets = 0; // TODO: Implementar contagem global de pets
  const newClients = contacts.filter((c) => {
    const createdDate = new Date(c.created_at || c.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate > thirtyDaysAgo;
  }).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Clientes & Pets"
        subtitle="Gerencie clientes e seus pets"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient text-white">
                <UserPlus className="w-4 h-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                <DialogDescription>
                  Preencha os dados do cliente para cadastrá-lo no sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    placeholder="Ex: João Silva"
                    value={newContact.full_name}
                    onChange={(e) =>
                      setNewContact({ ...newContact, full_name: e.target.value })
                    }
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Telefone (com DDD) *</Label>
                  <Input
                    id="phone_number"
                    placeholder="Ex: 11987654321"
                    value={newContact.phone_number}
                    onChange={(e) =>
                      setNewContact({ ...newContact, phone_number: e.target.value })
                    }
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ex: joao@email.com"
                    value={newContact.email}
                    onChange={(e) =>
                      setNewContact({ ...newContact, email: e.target.value })
                    }
                    disabled={isCreating}
                  />
                </div>
                <Button
                  onClick={handleCreateContact}
                  disabled={isCreating}
                  className="w-full btn-gradient text-white"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Criar Cliente
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
          icon={Users}
          title="Total de Clientes"
          value={isLoading ? "-" : total}
          subtitle="Cadastrados"
        />
        <StatCard
          icon={UserPlus}
          title="Novos Clientes"
          value={isLoading ? "-" : newClients}
          subtitle="Últimos 30 dias"
        />
        <StatCard
          icon={Dog}
          title="Total de Pets"
          value={isLoading ? "-" : totalPets}
          subtitle="Cadastrados"
        />
        <StatCard
          icon={Bot}
          title="Cadastros pela IA"
          value={isLoading ? "-" : newClients}
          subtitle="Automáticos"
        />
      </div>

      {/* Busca e Filtros */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Buscar por nome, telefone ou email..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Todos
              </Button>
              <Button variant="outline" size="sm">
                Ativos
              </Button>
              <Button variant="outline" size="sm">
                Novos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
        </div>
      ) : contacts.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery ? "Tente buscar com outro termo" : "Cadastre seu primeiro cliente"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((client) => {
            const isNew = new Date(client.created_at || client.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            return (
              <Card key={client.id} className="glass-card hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{client.full_name || client.name}</h3>
                      <p className="text-sm text-muted-foreground">{client.phone_number || client.phone}</p>
                      {client.email && (
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      )}
                    </div>
                    <Badge variant={isNew ? "default" : "secondary"}>
                      {isNew ? "Novo" : "Ativo"}
                    </Badge>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedClient(client);
                        setIsDetailsOpen(true);
                      }}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Ver Detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações completas do cliente e seus pets
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6 mt-4">
              {/* Informações do Cliente */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">{selectedClient.full_name || selectedClient.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedClient.phone_number || selectedClient.phone}</p>
                  </div>
                  {selectedClient.email && (
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedClient.email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Cadastrado em</p>
                    <p className="font-medium">
                      {new Date(selectedClient.createdAt || selectedClient.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={selectedClient.is_active ? "default" : "secondary"}>
                      {selectedClient.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Pets do Cliente */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Pets</h4>
                <ClientPets contactId={selectedClient.id} />
              </div>

              {/* Ações */}
              <div className="border-t pt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: Implementar edição
                    toast({
                      title: "Em desenvolvimento",
                      description: "Função de editar em breve!",
                    });
                  }}
                  className="flex-1"
                >
                  Editar Cliente
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
