import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Hotel, Calendar, Loader2, Plus, Sparkles } from "lucide-react";
import {
  useDaycareStays,
  useCreateDaycareStay,
  useUpdateDaycareStay,
  useStayUpsells,
  useAddExtraService,
} from "@/hooks/useDaycare";
import { usePets } from "@/hooks/usePets";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DaycareStays() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filters: any = {};
  if (statusFilter !== "all") filters.status = statusFilter;
  if (typeFilter !== "all") filters.stayType = typeFilter;

  const { data: staysData, isLoading } = useDaycareStays(filters);
  const createMutation = useCreateDaycareStay();
  const updateMutation = useUpdateDaycareStay();
  const addServiceMutation = useAddExtraService();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState("");
  const { data: petsData } = usePets(selectedContactId);
  const { data: upsellsData } = useStayUpsells(selectedStayId);

  const [formData, setFormData] = useState({
    pet_id: "",
    contact_id: "",
    stay_type: "daycare" as "daycare" | "hotel",
    check_in_date: "",
    check_out_date: "",
    notes: "",
    health_assessment: {
      vacinas: false,
      vermifugo: false,
      exames: [] as string[],
      restricoes_alimentares: [] as string[],
    },
    behavior_assessment: {
      socializacao: "",
      ansiedade: "",
      energia: "",
      teste_adaptacao: "",
    },
    extra_services: [] as string[],
  });

  const stays = staysData?.stays || [];
  const activeStays = stays.filter((s: any) => s.status === "em_estadia");
  const pendingStays = stays.filter((s: any) => s.status === "aguardando_avaliacao");

  const handleCreate = async () => {
    if (!formData.pet_id || !formData.check_in_date) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Selecione pet e data de check-in",
      });
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast({
        title: "✅ Estadia criada!",
        description: "A estadia foi registrada com sucesso",
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar estadia",
      });
    }
  };

  const handleAddService = async (stayId: string, service: string) => {
    try {
      await addServiceMutation.mutateAsync({ stayId, service });
      toast({
        title: "✅ Serviço adicionado!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar serviço",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      pet_id: "",
      contact_id: "",
      stay_type: "daycare",
      check_in_date: "",
      check_out_date: "",
      notes: "",
      health_assessment: {
        vacinas: false,
        vermifugo: false,
        exames: [],
        restricoes_alimentares: [],
      },
      behavior_assessment: {
        socializacao: "",
        ansiedade: "",
        energia: "",
        teste_adaptacao: "",
      },
      extra_services: [],
    });
    setSelectedContactId("");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      aguardando_avaliacao: { label: "Aguardando", className: "bg-yellow-100 text-yellow-800" },
      aprovado: { label: "Aprovado", className: "bg-green-100 text-green-800" },
      em_estadia: { label: "Em Estadia", className: "bg-blue-100 text-blue-800" },
      finalizado: { label: "Finalizado", className: "bg-gray-100 text-gray-800" },
      cancelado: { label: "Cancelado", className: "bg-red-100 text-red-800" },
    };
    const variant = variants[status] || variants.aguardando_avaliacao;
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Creche & Hotel"
        subtitle="Gerenciamento de estadias com avaliações e upsells inteligentes"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Estadia
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Estadias Ativas"
          value={activeStays.length}
          icon={Home}
          color="blue"
        />
        <StatCard
          title="Aguardando Avaliação"
          value={pendingStays.length}
          icon={Calendar}
          color="yellow"
        />
        <StatCard title="Total de Estadias" value={stays.length} icon={Hotel} color="purple" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="aguardando_avaliacao">Aguardando</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="em_estadia">Em Estadia</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="daycare">Creche</SelectItem>
            <SelectItem value="hotel">Hotel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stays List */}
      <Card>
        <CardHeader>
          <CardTitle>Estadias ({stays.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-ocean-blue" />
            </div>
          ) : stays.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma estadia encontrada 🏠
            </p>
          ) : (
            <div className="space-y-4">
              {stays.map((stay: any) => (
                <div
                  key={stay.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{stay.pet?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Tutor: {stay.contact?.full_name}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {getStatusBadge(stay.status)}
                      <Badge variant={stay.stay_type === "hotel" ? "default" : "secondary"}>
                        {stay.stay_type === "hotel" ? "🏨 Hotel" : "🏠 Creche"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Check-in:</p>
                      <p className="font-medium">
                        {new Date(stay.check_in_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-out:</p>
                      <p className="font-medium">
                        {stay.check_out_date
                          ? new Date(stay.check_out_date).toLocaleDateString("pt-BR")
                          : "Não definido"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vacinas:</p>
                      <p className="font-medium">
                        {stay.health_assessment?.vacinas ? "✅ OK" : "❌ Pendente"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Criado:</p>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(stay.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>

                  {stay.extra_services && stay.extra_services.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">🎁 Serviços Extras:</p>
                      <div className="flex flex-wrap gap-1">
                        {stay.extra_services.map((service: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {stay.status === "aprovado" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStayId(stay.id)}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Ver Sugestões
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Estadia</DialogTitle>
            <DialogDescription>Registre uma nova estadia de creche ou hotel</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente *</Label>
                <Input
                  placeholder="ID do cliente"
                  value={formData.contact_id}
                  onChange={(e) => {
                    setFormData({ ...formData, contact_id: e.target.value });
                    setSelectedContactId(e.target.value);
                  }}
                />
              </div>

              <div>
                <Label>Pet *</Label>
                <Select
                  value={formData.pet_id}
                  onValueChange={(value) => setFormData({ ...formData, pet_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {petsData?.map((pet: any) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={formData.stay_type}
                  onValueChange={(value: any) => setFormData({ ...formData, stay_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daycare">Creche</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Check-in *</Label>
                <Input
                  type="date"
                  value={formData.check_in_date}
                  onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Check-out</Label>
                <Input
                  type="date"
                  value={formData.check_out_date}
                  onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Avaliação de Saúde</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vacinas"
                    checked={formData.health_assessment.vacinas}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        health_assessment: {
                          ...formData.health_assessment,
                          vacinas: checked as boolean,
                        },
                      })
                    }
                  />
                  <label htmlFor="vacinas" className="text-sm">
                    Vacinas em dia
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vermifugo"
                    checked={formData.health_assessment.vermifugo}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        health_assessment: {
                          ...formData.health_assessment,
                          vermifugo: checked as boolean,
                        },
                      })
                    }
                  />
                  <label htmlFor="vermifugo" className="text-sm">
                    Vermífugo em dia
                  </label>
                </div>
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Estadia"
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upsells Dialog */}
      <Dialog open={!!selectedStayId} onOpenChange={() => setSelectedStayId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Sparkles className="w-5 h-5 inline mr-2 text-yellow-500" />
              Sugestões de Serviços Extras
            </DialogTitle>
            <DialogDescription>Serviços complementares personalizados</DialogDescription>
          </DialogHeader>

          {upsellsData?.suggestions?.length > 0 ? (
            <div className="space-y-3">
              {upsellsData.suggestions.map((upsell: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold capitalize">{upsell.service}</h4>
                    <Badge
                      variant={
                        upsell.priority === "high"
                          ? "destructive"
                          : upsell.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {upsell.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{upsell.reason}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">{upsell.price}</span>
                    <Button
                      size="sm"
                      onClick={() => handleAddService(selectedStayId!, upsell.service)}
                      disabled={addServiceMutation.isPending}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma sugestão disponível no momento
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
