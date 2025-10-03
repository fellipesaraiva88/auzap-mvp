import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { InstanceStatusBadge } from '@/components/admin/InstanceStatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Monitoring() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [instances, setInstances] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 10000); // Atualizar a cada 10s
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const token = localStorage.getItem('admin_token');

      const [instancesRes, queueRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/api/internal/monitoring/instances`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/internal/monitoring/queue-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/internal/monitoring/alerts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setInstances(instancesRes.data.instances);
      setQueueStats(queueRes.data);
      setAlerts(alertsRes.data.alerts);
    } catch (error: any) {
      console.error('Error fetching monitoring:', error);

      if (error.response?.status === 401) {
        navigate('/admin/login');
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao carregar monitoramento',
        description: error.response?.data?.error || 'Tente novamente'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceReconnect = async (instanceId: string) => {
    try {
      const token = localStorage.getItem('admin_token');

      await axios.post(
        `${API_URL}/api/internal/monitoring/force-reconnect/${instanceId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: 'Reconexão iniciada',
        description: 'A instância está sendo reconectada'
      });

      fetchMonitoringData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro na reconexão',
        description: error.response?.data?.error || 'Tente novamente'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-ocean-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento</h1>
          <p className="text-muted-foreground">Status em tempo real do sistema</p>
        </div>
        <Button onClick={() => fetchMonitoringData()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Alertas Ativos ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.map((alert: any, idx: number) => (
              <div key={idx} className="text-sm">
                <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {alert.type}
                </Badge>
                <span className="ml-2">{alert.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold">{queueStats?.queue?.pending || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Processando</p>
          <p className="text-2xl font-bold">{queueStats?.queue?.processing || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Concluídos</p>
          <p className="text-2xl font-bold text-green-600">{queueStats?.queue?.completed || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Falhados</p>
          <p className="text-2xl font-bold text-red-600">{queueStats?.queue?.failed || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Throughput</p>
          <p className="text-2xl font-bold">{queueStats?.throughput?.messages_per_minute || 0} msg/min</p>
        </Card>
      </div>

      {/* Instâncias */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instância</TableHead>
              <TableHead>Organização</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Última Conexão</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instances.map((instance: any) => (
              <TableRow key={instance.id}>
                <TableCell className="font-medium">{instance.instance_name}</TableCell>
                <TableCell>{instance.organizations?.name}</TableCell>
                <TableCell>{instance.phone_number || '-'}</TableCell>
                <TableCell>
                  <InstanceStatusBadge status={instance.status} />
                </TableCell>
                <TableCell>
                  {instance.last_connected_at
                    ? new Date(instance.last_connected_at).toLocaleString('pt-BR')
                    : 'Nunca'}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleForceReconnect(instance.id)}
                    disabled={instance.status === 'connected'}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
