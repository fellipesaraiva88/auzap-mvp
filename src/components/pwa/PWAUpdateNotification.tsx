import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function PWAUpdateNotification() {
  const [showReload, setShowReload] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('Service Worker registrado:', registration);
    },
    onRegisterError(error) {
      console.error('Erro ao registrar Service Worker:', error);
    },
    onNeedRefresh() {
      setShowReload(true);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowReload(true);
    }
  }, [needRefresh]);

  const handleUpdate = async () => {
    try {
      await updateServiceWorker(true);
      setShowReload(false);
      setNeedRefresh(false);
      // Recarrega a página após atualização
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  const handleDismiss = () => {
    setShowReload(false);
    setNeedRefresh(false);
  };

  if (!showReload) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-top-5">
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-background shadow-2xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                <h3 className="font-semibold text-sm">Atualização Disponível</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Uma nova versão do AuZap está disponível. Atualize agora para aproveitar as melhorias!
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleUpdate}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar Agora
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Depois
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
