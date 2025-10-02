import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useWhatsAppStatus } from "@/hooks/useWhatsApp";
import { DashboardCardSkeleton, ErrorState } from "./LoadingStates";

interface WhatsAppStatusProps {
  instanceId: string;
}

export function WhatsAppStatusCard({ instanceId }: WhatsAppStatusProps) {
  const { data, isLoading, error, refetch } = useWhatsAppStatus(instanceId);

  if (isLoading) {
    return <DashboardCardSkeleton />;
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-4">
        <ErrorState
          message="Erro ao verificar WhatsApp"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isConnected = data?.connected || false;
  const isConnecting = data?.status === 'connecting';

  return (
    <div className={`flex items-center gap-3 px-4 py-2 ${
      isConnected
        ? 'bg-ai-success/10 border-ai-success/20'
        : isConnecting
        ? 'bg-yellow-500/10 border-yellow-500/20'
        : 'bg-gray-500/10 border-gray-500/20'
    } border rounded-xl`}>
      <div className={`w-2 h-2 rounded-full ${
        isConnected
          ? 'bg-ai-success animate-pulse'
          : isConnecting
          ? 'bg-yellow-500 animate-pulse'
          : 'bg-gray-500'
      }`}></div>

      {isConnecting ? (
        <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
      ) : isConnected ? (
        <Wifi className="w-4 h-4 text-ai-success" />
      ) : (
        <WifiOff className="w-4 h-4 text-gray-500" />
      )}

      <span className={`text-sm font-semibold ${
        isConnected
          ? 'text-ai-success'
          : isConnecting
          ? 'text-yellow-500'
          : 'text-gray-500'
      }`}>
        {isConnecting ? 'Conectando...' : isConnected ? 'IA Online' : 'WhatsApp Offline'}
      </span>

      {data?.instance?.phone_number && (
        <span className="text-xs text-muted-foreground ml-auto">
          {data.instance.phone_number}
        </span>
      )}
    </div>
  );
}
