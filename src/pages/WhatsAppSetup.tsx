import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { PhoneInput } from '@/components/PhoneInput';
import { useWhatsAppInstances, useInitializeWhatsApp } from '@/hooks/useWhatsApp';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, MessageSquare, QrCode, Smartphone, Check, ArrowLeft } from 'lucide-react';
import { isValidPhoneNumber, formatPhoneNumberIntl } from 'react-phone-number-input';
import { ModalDinheiroEsquecido } from '@/components/esquecidos/ModalDinheiroEsquecido';
import { ProgressoDaIA } from '@/components/esquecidos/ProgressoDaIA';
import { useClientesEsquecidos } from '@/hooks/useClientesEsquecidos';

export default function WhatsAppSetup() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useWhatsAppInstances();
  const initializeWhatsApp = useInitializeWhatsApp();

  // Dinheiro Esquecido
  const {
    progresso,
    vasculhandoAgora,
    resultadoVasculhada,
    estatisticas
  } = useClientesEsquecidos();

  const [modalEsquecidosOpen, setModalEsquecidosOpen] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authMethod, setAuthMethod] = useState<'pairing_code' | 'qr_code'>('qr_code');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const instances = data?.instances || [];

  // Abrir modal automaticamente quando vasculhada terminar
  useEffect(() => {
    if (resultadoVasculhada && resultadoVasculhada.total_clientes_esquecidos > 0) {
      // Aguardar 2s para dar tempo de processar
      setTimeout(() => {
        setModalEsquecidosOpen(true);
      }, 2000);
    }
  }, [resultadoVasculhada]);

  const handleNext = () => {
    // Validar telefone se for pairing code
    if (authMethod === 'pairing_code' && !phoneNumber.trim()) {
      toast({
        variant: 'destructive',
        title: 'Número obrigatório',
        description: 'Digite seu número WhatsApp para receber o código',
      });
      return;
    }

    if (authMethod === 'pairing_code' && !isValidPhoneNumber(phoneNumber)) {
      toast({
        variant: 'destructive',
        title: 'Número inválido',
        description: 'Verifique se digitou o número completo com DDD',
      });
      return;
    }

    // Mostrar confirmação se for pairing code
    if (authMethod === 'pairing_code') {
      setShowConfirmation(true);
    } else {
      // QR Code vai direto
      handleCreateInstance();
    }
  };

  const handleCreateInstance = async () => {
    try {
      const instanceId = `instance_${Date.now()}`;
      const result = await initializeWhatsApp.mutateAsync({
        instanceId,
        phoneNumber: phoneNumber.trim() ? phoneNumber.replace(/\D/g, '') : undefined,
        preferredAuthMethod: authMethod,
      });

      if (result.success && result.pairingCode) {
        toast({
          title: '✅ Código gerado!',
          description: `Digite no WhatsApp: ${result.pairingCode}`,
          duration: 15000,
        });
        setPhoneNumber('');
        setQrCodeData(null);
        setShowConfirmation(false);
        setDialogOpen(false);
        refetch();
      } else if (result.qrCode) {
        setQrCodeData(result.qrCode);
        toast({
          title: '✅ Aponte a câmera',
          description: 'QR Code gerado! Escaneie no WhatsApp',
          duration: 5000,
        });
      } else {
        // Bug fix: feedback quando resposta inesperada
        toast({
          variant: 'destructive',
          title: 'Algo deu errado',
          description: result.error || 'Tente novamente ou use outro método',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao conectar',
        description: error.response?.data?.error || error.message || 'Tente novamente',
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
        title="Conecte seu WhatsApp"
        subtitle="IA atendendo clientes 24/7 no seu WhatsApp"
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setShowConfirmation(false);
              setQrCodeData(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="btn-gradient text-white">
                <Plus className="w-4 h-4 mr-2" />
                Conectar WhatsApp
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {showConfirmation ? 'Confirme seu número' : qrCodeData ? '✅ Aponte a câmera' : 'Como você quer conectar?'}
                </DialogTitle>
                <DialogDescription>
                  {showConfirmation
                    ? 'Verifique se está correto antes de continuar'
                    : qrCodeData
                    ? 'Escaneie este código no WhatsApp'
                    : 'Escolha o jeito mais fácil para você'
                  }
                </DialogDescription>
              </DialogHeader>

              {showConfirmation ? (
                /* Tela de Confirmação */
                <div className="space-y-6 py-4">
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">É esse seu WhatsApp?</p>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-mono font-semibold text-blue-900">
                        {formatPhoneNumberIntl(phoneNumber)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowConfirmation(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Não, corrigir
                    </Button>
                    <Button
                      onClick={handleCreateInstance}
                      disabled={initializeWhatsApp.isPending}
                      className="flex-1 btn-gradient text-white"
                    >
                      {initializeWhatsApp.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Sim, conectar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : qrCodeData ? (
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
                    <RadioGroup value={authMethod} onValueChange={(value) => setAuthMethod(value as 'pairing_code' | 'qr_code')}>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="qr_code" id="qr" />
                        <Label htmlFor="qr" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="font-medium">QR Code</p>
                              <p className="text-xs text-muted-foreground">Escaneie com a câmera • ✨ Mais fácil</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="pairing_code" id="pairing" />
                        <Label htmlFor="pairing" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-ocean-blue" />
                            <div>
                              <p className="font-medium">Código de 8 Dígitos</p>
                              <p className="text-xs text-muted-foreground">Digite no WhatsApp • ✨ Mais rápido</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Input de telefone (condicional) */}
                  {authMethod === 'pairing_code' && (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Seu número WhatsApp</Label>
                      <PhoneInput
                        value={phoneNumber}
                        onChange={setPhoneNumber}
                        disabled={initializeWhatsApp.isPending}
                      />
                      <p className="text-xs text-muted-foreground">
                        Incluindo código do país e DDD
                      </p>
                    </div>
                  )}

                  {authMethod === 'qr_code' && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Rapidinho:</strong> Vamos gerar um QR Code. Deixe seu WhatsApp aberto para escanear.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleNext}
                    disabled={initializeWhatsApp.isPending}
                    className="w-full btn-gradient text-white"
                  >
                    {initializeWhatsApp.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : authMethod === 'pairing_code' ? (
                      <>
                        Continuar
                        <Smartphone className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Gerar QR Code
                        <QrCode className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        }
      />

      {/* Progresso da Vasculhada */}
      {vasculhandoAgora && (
        <div className="mb-6">
          <ProgressoDaIA progresso={progresso} vasculhandoAgora={vasculhandoAgora} />
        </div>
      )}

      {instances.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Pronto para começar?</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Conecte seu WhatsApp e deixe a IA trabalhar por você 24/7
            </p>
            <Button onClick={() => setDialogOpen(true)} className="btn-gradient text-white">
              <Plus className="w-4 h-4 mr-2" />
              Conectar Meu WhatsApp
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

      {/* Modal Dinheiro Esquecido */}
      <ModalDinheiroEsquecido
        open={modalEsquecidosOpen}
        onOpenChange={setModalEsquecidosOpen}
      />

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
