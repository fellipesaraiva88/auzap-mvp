import { useState } from 'react';
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
import { useWhatsAppInstances, useInitializeWhatsApp } from '@/hooks/useWhatsApp';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, MessageSquare } from 'lucide-react';

export default function WhatsAppSetup() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useWhatsAppInstances();
  const initializeWhatsApp = useInitializeWhatsApp();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const instances = data?.instances || [];

  const handleCreateInstance = async () => {
    if (!phoneNumber.trim()) {
      toast({
        variant: 'destructive',
        title: 'Telefone obrigatório',
        description: 'Digite o número do WhatsApp com DDD (ex: 5511999887766)',
      });
      return;
    }

    try {
      const instanceId = `instance_${Date.now()}`;
      const result = await initializeWhatsApp.mutateAsync({
        instanceId,
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        preferredAuthMethod: 'pairing_code',
      });

      if (result.success && result.pairingCode) {
        toast({
          title: '✅ Instância criada!',
          description: `Código de pareamento: ${result.pairingCode}`,
          duration: 10000,
        });
      } else if (result.qrCode) {
        toast({
          title: 'QR Code gerado!',
          description: 'Escaneie o QR Code no WhatsApp',
        });
      }

      setPhoneNumber('');
      setDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar instância',
        description: error.response?.data?.error || 'Tente novamente',
      });
    }
  };

  if (isLoading) {
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
                <DialogTitle>Criar Nova Instância WhatsApp</DialogTitle>
                <DialogDescription>
                  Digite o número do WhatsApp com DDD para gerar o código de pareamento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Número WhatsApp (com DDD)</Label>
                  <Input
                    id="phone"
                    placeholder="Ex: 5511999887766"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={initializeWhatsApp.isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite apenas números, incluindo código do país e DDD
                  </p>
                </div>
                <Button
                  onClick={handleCreateInstance}
                  disabled={initializeWhatsApp.isPending}
                  className="w-full btn-gradient text-white"
                >
                  {initializeWhatsApp.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Gerar Código de Pareamento'
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
              key={instance.instanceId}
              instance={instance}
              onUpdate={refetch}
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
