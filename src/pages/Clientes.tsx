import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Dog, Cat, Bot } from "lucide-react";
import { mockClients } from "@/data/mockData";

export default function Clientes() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = mockClients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPets = mockClients.reduce((sum, client) => sum + client.pets.length, 0);
  const newClients = mockClients.filter((c) => c.status === "new").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Clientes & Pets"
        subtitle="Gerencie clientes e seus pets"
        actions={
          <Button>
            <UserPlus className="w-4 h-4" />
            Novo Cliente
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          title="Total de Clientes"
          value={mockClients.length}
          subtitle="Cadastrados"
        />
        <StatCard
          icon={UserPlus}
          title="Novos Clientes"
          value={newClients}
          subtitle="Últimos 30 dias"
        />
        <StatCard
          icon={Dog}
          title="Total de Pets"
          value={totalPets}
          subtitle="Cadastrados"
        />
        <StatCard
          icon={Bot}
          title="Cadastros pela IA"
          value={newClients}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="glass-card hover-scale">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.phone}</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
                <Badge
                  variant={client.status === "new" ? "default" : "secondary"}
                >
                  {client.status === "new" ? "Novo" : "Ativo"}
                </Badge>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  🐾 Pets ({client.pets.length})
                </p>
                <div className="space-y-2">
                  {client.pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {pet.species === "dog" ? (
                        <Dog className="w-4 h-4 text-ocean-blue" />
                      ) : (
                        <Cat className="w-4 h-4 text-ocean-blue" />
                      )}
                      <span className="font-medium">{pet.name}</span>
                      <span className="text-muted-foreground">
                        • {pet.breed} • {pet.age} anos
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <Button variant="outline" size="sm" className="w-full">
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
