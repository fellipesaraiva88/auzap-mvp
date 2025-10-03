import { useState, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Grid3x3,
  List,
  Calendar,
  DollarSign,
  MapPin,
  Dog,
  Clock,
  TrendingUp,
  AlertCircle,
  Star,
  MessageSquare,
  Phone,
  Plus,
  ChevronDown,
  Activity,
  Zap,
} from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { usePets } from "@/hooks/usePets";
import { useToast } from "@/hooks/use-toast";
import { useHotkeys } from "react-hotkeys-hook";
import Fuse from "fuse.js";
import { ClientCard } from "@/components/kanban/ClientCard";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { CreateClientPetModal } from "@/components/modals/CreateClientPetModal";
import { ClientFilters } from "@/components/kanban/ClientFilters";
import { exportToCSV } from "@/utils/exportCSV";
import { cn } from "@/lib/utils";

// Tipos de visualização Kanban
type KanbanView = "status" | "interaction" | "pets" | "value" | "region";

// Estrutura das colunas para cada visualização
const KANBAN_COLUMNS = {
  status: [
    { id: "new", title: "Novos", icon: UserPlus, color: "bg-blue-500" },
    { id: "active", title: "Ativos", icon: Activity, color: "bg-green-500" },
    { id: "inactive", title: "Inativos", icon: Clock, color: "bg-gray-500" },
    { id: "vip", title: "VIP", icon: Star, color: "bg-yellow-500" },
  ],
  interaction: [
    { id: "today", title: "Hoje", icon: Clock, color: "bg-green-500" },
    { id: "week", title: "Esta Semana", icon: Calendar, color: "bg-blue-500" },
    { id: "month", title: "Este Mês", icon: Calendar, color: "bg-orange-500" },
    { id: "old", title: "Antigos", icon: AlertCircle, color: "bg-gray-500" },
  ],
  pets: [
    { id: "no-pets", title: "Sem Pets", icon: AlertCircle, color: "bg-red-500" },
    { id: "1-pet", title: "1 Pet", icon: Dog, color: "bg-blue-500" },
    { id: "2-pets", title: "2+ Pets", icon: Dog, color: "bg-green-500" },
    { id: "multi-pets", title: "Multi-pets (5+)", icon: Star, color: "bg-purple-500" },
  ],
  value: [
    { id: "potential", title: "Potencial", icon: TrendingUp, color: "bg-gray-500" },
    { id: "bronze", title: "Bronze", icon: DollarSign, color: "bg-orange-700" },
    { id: "silver", title: "Silver", icon: DollarSign, color: "bg-gray-400" },
    { id: "gold", title: "Gold", icon: Star, color: "bg-yellow-500" },
  ],
  region: [
    { id: "north", title: "Norte", icon: MapPin, color: "bg-blue-500" },
    { id: "south", title: "Sul", icon: MapPin, color: "bg-green-500" },
    { id: "east", title: "Leste", icon: MapPin, color: "bg-orange-500" },
    { id: "west", title: "Oeste", icon: MapPin, color: "bg-purple-500" },
  ],
};

export default function ClientesKanban() {
  const { contacts, isLoading, refetch } = useContacts();
  const { toast } = useToast();

  // Estados
  const [currentView, setCurrentView] = useState<KanbanView>("status");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [columnData, setColumnData] = useState<Record<string, any[]>>({});

  // Sensores do DnD Kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Busca fuzzy com Fuse.js
  const fuse = useMemo(
    () =>
      new Fuse(contacts, {
        keys: ["full_name", "phone_number", "email"],
        threshold: 0.3,
      }),
    [contacts]
  );

  // Filtrar contatos baseado na busca e filtros
  const filteredContacts = useMemo(() => {
    let result = contacts;

    // Aplicar busca
    if (searchQuery) {
      result = fuse.search(searchQuery).map((r) => r.item);
    }

    // Aplicar filtros
    if (activeFilters.length > 0) {
      result = result.filter((contact) => {
        // Lógica de filtros aqui
        return true; // Placeholder
      });
    }

    return result;
  }, [contacts, searchQuery, activeFilters, fuse]);

  // Organizar contatos em colunas baseado na visualização
  const organizedData = useMemo(() => {
    const columns = KANBAN_COLUMNS[currentView];
    const data: Record<string, any[]> = {};

    columns.forEach((col) => {
      data[col.id] = [];
    });

    filteredContacts.forEach((contact) => {
      let columnId = "new"; // Default

      switch (currentView) {
        case "status":
          // Lógica para categorizar por status
          const daysSinceCreation = Math.floor(
            (Date.now() - new Date(contact.created_at || contact.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (daysSinceCreation <= 7) columnId = "new";
          else if (contact.is_active !== false) columnId = "active";
          else columnId = "inactive";
          // VIP baseado em alguma lógica (ex: mais de 10 agendamentos)
          break;

        case "interaction":
          // Lógica para última interação
          const lastMessage = contact.last_message_at;
          if (!lastMessage) {
            columnId = "old";
          } else {
            const daysSinceMessage = Math.floor(
              (Date.now() - new Date(lastMessage).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceMessage === 0) columnId = "today";
            else if (daysSinceMessage <= 7) columnId = "week";
            else if (daysSinceMessage <= 30) columnId = "month";
            else columnId = "old";
          }
          break;

        case "pets":
          // Será implementado quando tivermos contagem de pets
          columnId = "no-pets";
          break;

        case "value":
          // Lógica baseada em valor do cliente
          columnId = "potential";
          break;

        case "region":
          // Lógica baseada em região/localização
          columnId = "north";
          break;
      }

      if (data[columnId]) {
        data[columnId].push(contact);
      }
    });

    return data;
  }, [filteredContacts, currentView]);

  // Handlers de Drag and Drop
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveDragId(null);
      return;
    }

    const activeColumnId = active.data.current?.columnId;
    const overColumnId = over.data.current?.columnId || over.id;

    if (activeColumnId !== overColumnId) {
      // Movendo entre colunas
      toast({
        title: "Cliente movido!",
        description: `Status atualizado para ${overColumnId}`,
      });
      // Aqui você implementaria a lógica para atualizar o status no backend
    }

    setActiveDragId(null);
  };

  // Atalhos de teclado
  useHotkeys("ctrl+n", () => setIsCreateModalOpen(true));
  useHotkeys("/", () => document.getElementById("search-input")?.focus());
  useHotkeys("ctrl+k", () => setViewMode(viewMode === "kanban" ? "list" : "kanban"));

  // Handler de exportação
  const handleExport = () => {
    const exportData = filteredContacts.map((c) => ({
      Nome: c.full_name || c.name,
      Telefone: c.phone_number || c.phone,
      Email: c.email || "",
      Cadastrado: new Date(c.created_at || c.createdAt).toLocaleDateString("pt-BR"),
      Status: c.is_active !== false ? "Ativo" : "Inativo",
    }));
    exportToCSV(exportData, `clientes-kanban-${currentView}`);
    toast({
      title: "✅ Exportado com sucesso!",
      description: `${exportData.length} clientes exportados`,
    });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Clientes & Pets"
        subtitle="Gestão visual e intuitiva dos seus clientes"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "kanban" ? "list" : "kanban")}
            >
              {viewMode === "kanban" ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4" />
            </Button>
            <Button
              className="btn-gradient text-white"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo Cliente
            </Button>
          </div>
        }
      />

      {/* Tabs de Visualização */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as KanbanView)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="status">
                <Activity className="w-4 h-4 mr-2" />
                Por Status
              </TabsTrigger>
              <TabsTrigger value="interaction">
                <Clock className="w-4 h-4 mr-2" />
                Por Interação
              </TabsTrigger>
              <TabsTrigger value="pets">
                <Dog className="w-4 h-4 mr-2" />
                Por Pets
              </TabsTrigger>
              <TabsTrigger value="value">
                <DollarSign className="w-4 h-4 mr-2" />
                Por Valor
              </TabsTrigger>
              <TabsTrigger value="region">
                <MapPin className="w-4 h-4 mr-2" />
                Por Região
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Busca e Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            id="search-input"
            placeholder="Buscar clientes... (pressione / para focar)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <ClientFilters
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
        />
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Clientes</p>
              <p className="text-2xl font-bold">{filteredContacts.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Novos (7 dias)</p>
              <p className="text-2xl font-bold">
                {
                  filteredContacts.filter((c) => {
                    const days = Math.floor(
                      (Date.now() - new Date(c.created_at || c.createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return days <= 7;
                  }).length
                }
              </p>
            </div>
            <UserPlus className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Taxa Atividade</p>
              <p className="text-2xl font-bold">
                {Math.round(
                  (filteredContacts.filter((c) => c.is_active !== false).length /
                    filteredContacts.length) *
                    100
                )}
                %
              </p>
            </div>
            <Zap className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Engajamento</p>
              <p className="text-2xl font-bold">87%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-200" />
          </div>
        </motion.div>
      </div>

      {/* Kanban Board */}
      {viewMode === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-4 gap-4">
            {KANBAN_COLUMNS[currentView].map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                items={organizedData[column.id] || []}
                currentView={currentView}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDragId ? (
              <div className="opacity-50">
                <ClientCard
                  client={filteredContacts.find((c) => c.id === activeDragId)!}
                  isDragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        // Lista tradicional (implementar depois)
        <div className="grid grid-cols-1 gap-4">
          {filteredContacts.map((client) => (
            <Card key={client.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{client.full_name || client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.phone_number}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      <CreateClientPetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}