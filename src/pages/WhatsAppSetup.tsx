import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { Plus, Loader2, MessageSquare, QrCode, Smartphone } from 'lucide-react';

export default function WhatsAppSetup() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useWhatsAppInstances();
  const initializeWhatsApp = useInitializeWhatsApp();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authMethod, setAuthMethod] = useState<'pairing_code' | 'qr_code'>('pairing_code');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  const instances = data?.instances || [];

  const handleCreateInstance = async () => {
    // Validar telefone apenas se for pairing code
    if (authMethod === 'pairing_code' && !phoneNumber.trim()) {
      toast({
        variant: 'destructive',
        title: 'Telefone obrigatório',
        description: 'Digite o número do WhatsApp com DDD para gerar código de pareamento',
      });
      return;
    }

    try {
      const instanceId = `instance_${Date.now()}`;
      const result = await initializeWhatsApp.mutateAsync({
        instanceId,
        phoneNumber: phoneNumber.trim() ? phoneNumber.replace(/\D/g, '') : undefined,
        preferredAuthMethod: authMethod,
      });

      if (result.success && result.pairingCode) {
        toast({
          title: '✅ Código de Pareamento Gerado!',
          description: `Digite este código no WhatsApp: ${result.pairingCode}`,
          duration: 15000,
        });
        setPhoneNumber('');
        setQrCodeData(null);
        setDialogOpen(false);
        refetch();
      } else if (result.qrCode) {
        // Exibir QR Code no dialog
        setQrCodeData(result.qrCode);
        toast({
          title: '📱 QR Code Gerado!',
          description: 'Escaneie o código abaixo no seu WhatsApp',
          duration: 5000,
        });
      }
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Instância WhatsApp</DialogTitle>
                <DialogDescription>
                  Escolha o método de conexão preferido
                </DialogDescription>
              </DialogHeader>

              {qrCodeData ? (
                /* Exibir QR Code */
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg border-2 border-ocean-blue/20">
                    <p className="text-sm text-center mb-3 font-medium text-gray-700">
                      📱 Escaneie este QR Code no WhatsApp
                    </p>
                    <img src={qrCodeData} alt="QR Code WhatsApp" className="w-full max-w-xs mx-auto" />
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800 font-medium mb-1">Como conectar:</p>
                      <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                        <li>Abra WhatsApp no celular</li>
                        <li>Toque em Mais opções (⋮) → Aparelhos conectados</li>
                        <li>Toque em Conectar um aparelho</li>
                        <li>Aponte para esta tela</li>
                      </ol>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setQrCodeData(null);
                        setDialogOpen(false);
                        setPhoneNumber('');
                        refetch();
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Fechar
                    </Button>
                    <Button
                      onClick={handleCreateInstance}
                      disabled={initializeWhatsApp.isPending}
                      className="flex-1 btn-gradient text-white"
                    >
                      {initializeWhatsApp.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4 mr-2" />
                          Gerar Novo QR
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Formulário de criação */
                <div className="space-y-4 mt-4">
                  {/* Seletor de método */}
                  <div className="space-y-3">
                    <Label>Método de Conexão</Label>
                    <RadioGroup value={authMethod} onValueChange={(value) => setAuthMethod(value as 'pairing_code' | 'qr_code')}>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="pairing_code" id="pairing" />
                        <Label htmlFor="pairing" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-ocean-blue" />
                            <div>
                              <p className="font-medium">Código de Pareamento</p>
                              <p className="text-xs text-muted-foreground">Digite 8 dígitos no WhatsApp</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="qr_code" id="qr" />
                        <Label htmlFor="qr" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="font-medium">QR Code</p>
                              <p className="text-xs text-muted-foreground">Escaneie com a câmera</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Input de telefone (condicional) */}
                  {authMethod === 'pairing_code' && (
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
                  )}

                  {authMethod === 'qr_code' && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Dica:</strong> O QR Code será gerado na próxima tela. Mantenha seu WhatsApp aberto para escanear rapidamente.
                      </p>
                    </div>
                  )}

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
                    ) : authMethod === 'pairing_code' ? (
                      <>
                        <Smartphone className="w-4 h-4 mr-2" />
                        Gerar Código de Pareamento
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Gerar QR Code
                      </>
                    )}
                  </Button>
                </div>
              )}
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
