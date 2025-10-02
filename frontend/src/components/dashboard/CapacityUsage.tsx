import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCapacity } from '@/hooks/useCapacity';
import { useTenant } from '@/hooks/useTenant';
import { Skeleton } from '@/components/ui/Skeleton';

export function CapacityUsage() {
  const { organizationId } = useTenant();
  const { data, isLoading } = useCapacity(organizationId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!data || !data.services.length) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🏨 Ocupação dos Serviços
        </h3>
        <p className="text-gray-600">
          Nenhum serviço cadastrado ainda. Crie seus serviços primeiro.
        </p>
      </div>
    );
  }

  const { services, summary } = data;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🏨 Ocupação dos Serviços
        </h3>
        <p className="text-sm text-gray-600">
          Acompanhe o uso de capacidade e receita de cada serviço
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service, index) => (
          <div
            key={service.id || index}
            className="space-y-3 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          >
            {/* Header do Serviço */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">
                {service.name}
              </span>
              <span
                className="text-2xl font-bold"
                style={{ color: service.color }}
              >
                {service.percentage}%
              </span>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${service.percentage}%`,
                  backgroundColor: service.color,
                }}
              />
            </div>

            {/* Métricas do Serviço */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {service.occupied}/{service.total} vagas
              </span>
              <span className="font-bold text-green-600">
                R$ {service.dailyRevenue.toLocaleString('pt-BR')}/dia
              </span>
            </div>

            {/* Alertas e Status */}
            {service.percentage < 100 && (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-800">
                  <strong>Oportunidade:</strong> Você está deixando{' '}
                  {100 - service.percentage}% na mesa. A IA pode fazer campanha
                  de ocupação.
                </p>
              </div>
            )}

            {service.percentage === 100 && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-800">
                  <strong>Capacidade Máxima!</strong>{' '}
                  {service.waitingList
                    ? 'Lista de espera ativa'
                    : 'Operando em 100%'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumo Total */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalOccupied}
            </div>
            <div className="text-xs text-gray-600 mt-1">Vagas Ocupadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              R$ {summary.totalRevenue.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-gray-600 mt-1">Receita/Dia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {summary.averageOccupancy}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Ocupação Média</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {summary.servicesAtCapacity}/{services.length}
            </div>
            <div className="text-xs text-gray-600 mt-1">Serviços Lotados</div>
          </div>
        </div>
      </div>
    </div>
  );
}
