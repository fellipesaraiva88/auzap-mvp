import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WhatsAppInstanceCard } from '@/components/WhatsAppInstanceCard';
import { whatsappService, type WhatsAppInstance } from '@/services/whatsapp.service';
import { addSocketListener, removeSocketListener } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, MessageSquare } from 'lucide-react';

export default function WhatsAppSetup() {
  const { toast } = useToast();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');

  const loadInstances = async () => {
    try {
      const data = await whatsappService.listInstances();
      setInstances(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar instâncias',
        description: 'Tente recarregar a página',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();

    // Socket.io listeners para eventos WhatsApp
    addSocketListener('whatsapp:connected', ({ instanceId, phoneNumber }) => {
      toast({
        title: '✅ WhatsApp Conectado!',
        description: `Número: ${phoneNumber}`,
      });
      loadInstances();
    });

    addSocketListener('whatsapp:disconnected', ({ instanceId }) => {
      toast({
        title: '⚠️ WhatsApp Desconectado',
        description: 'A instância foi desconectada',
      });
      loadInstances();
    });

    addSocketListener('whatsapp:qr', ({ instanceId, qrCode }) => {
      loadInstances(); // Recarregar para mostrar QR code
    });

    return () => {
      removeSocketListener('whatsapp:connected');
      removeSocketListener('whatsapp:disconnected');
      removeSocketListener('whatsapp:qr');
    };
  }, []);

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nome obrigatório',
        description: 'Digite um nome para a instância',
      });
      return;
    }

    setCreating(true);
    try {
      await whatsappService.createInstance({
        name: newInstanceName,
      });

      toast({
        title: 'Instância criada!',
        description: 'Agora você pode conectar ao WhatsApp',
      });

      setNewInstanceName('');
      setDialogOpen(false);
      loadInstances();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar instância',
        description: error.response?.data?.error || 'Tente novamente',
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Configuração WhatsApp"
        subtitle="Gerencie suas instâncias do WhatsApp Business"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Instância
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Instância</DialogTitle>
                <DialogDescription>
                  Crie uma nova instância do WhatsApp para conectar um número
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Instância</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Atendimento Principal"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    disabled={creating}
                  />
                </div>
                <Button
                  onClick={handleCreateInstance}
                  disabled={creating}
                  className="w-full btn-gradient text-white"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Instância'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {instances.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma instância criada</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Crie sua primeira instância do WhatsApp para começar a atender seus clientes
              automaticamente com IA
            </p>
            <Button onClick={() => setDialogOpen(true)} className="btn-gradient text-white">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Instância
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instances.map((instance) => (
            <WhatsAppInstanceCard
              key={instance.id}
              instance={instance}
              onUpdate={loadInstances}
            />
          ))}
        </div>
      )}

      {/* Info Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-ocean-blue" />
              Como Funciona?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>1. Crie uma nova instância</li>
              <li>2. Conecte usando QR Code ou código de pareamento</li>
              <li>3. A IA começa a atender automaticamente</li>
              <li>4. Acompanhe todas as conversas em tempo real</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-600" />
              Métodos de Conexão
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• <strong>QR Code:</strong> Escaneie no WhatsApp → Aparelhos Conectados</li>
              <li>• <strong>Pareamento:</strong> Digite o código no WhatsApp → Aparelhos Conectados</li>
              <li>• Mantenha o WhatsApp instalado no celular</li>
              <li>• A conexão é mantida automaticamente</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
