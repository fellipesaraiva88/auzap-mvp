import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useTenant } from '@/hooks/useTenant';
import { Skeleton } from '@/components/ui/Skeleton';

export function ImpactPanel() {
  const { organizationId } = useTenant();
  const { data, isLoading } = useDashboardMetrics(organizationId, '7d');

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-8">
        <Skeleton className="h-8 w-64 mx-auto mb-8" />
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const impactData = {
    timeRecovered: data.impactData.timeRecovered,
    moneySaved: data.impactData.moneySaved,
    salesClosed: data.impactData.salesClosed,
    workDays: data.impactData.workDays,
    nightlyStats: {
      clientsServed: 8,
      appointmentsBooked: 3,
      salesValue: 340,
      followUpsSent: 12,
    },
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-6">
      {/* Título Principal */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-blue-600 mb-2">
          🎯 SEU TEMPO RECUPERADO
        </h2>
        <p className="text-gray-600">(Últimos 7 dias)</p>
      </div>

      {/* Tempo Recuperado - Destaque Principal */}
      <div className="bg-white rounded-xl p-8 text-center mb-8 shadow-lg border border-blue-200">
        <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          ⏰ {impactData.timeRecovered}
        </div>
        <p className="text-xl text-gray-600">
          Tempo que a IA trabalhou no seu lugar
        </p>
      </div>

      {/* Separador */}
      <div className="border-t-2 border-blue-300 my-8"></div>

      {/* O Que Isso Significa */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          O QUE ISSO SIGNIFICA:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 text-center border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-2">
              💵 R$ {impactData.moneySaved}
            </div>
            <p className="text-sm text-gray-600">
              Em valor de hora-trabalho economizado*
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              🎯 {impactData.salesClosed} vendas
            </div>
            <p className="text-sm text-gray-600">Fechadas pela IA sozinha</p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center border border-purple-200">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              😴 {impactData.workDays} dias
            </div>
            <p className="text-sm text-gray-600">
              De trabalho que você NÃO precisou fazer este mês
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          * Baseado em R$ 45/hora (salário médio atendente)
        </p>
      </div>

      {/* Separador */}
      <div className="border-t-2 border-blue-300 my-8"></div>

      {/* Enquanto Você Dormia */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          🚀 ENQUANTO VOCÊ DORMIA (Última noite - 22h às 8h):
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-gray-900">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span>
                {impactData.nightlyStats.clientsServed} clientes atendidos
              </span>
            </div>

            <div className="flex items-center space-x-3 text-gray-900">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span>
                {impactData.nightlyStats.appointmentsBooked} agendamentos
                confirmados para hoje
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-gray-900">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span>
                2 vendas de ração fechadas (R${' '}
                {impactData.nightlyStats.salesValue})
              </span>
            </div>

            <div className="flex items-center space-x-3 text-gray-900">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span>
                {impactData.nightlyStats.followUpsSent} follow-ups enviados
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-indigo-100 rounded-lg p-4 border border-indigo-300">
          <p className="text-center text-indigo-800 font-medium">
            💡 A IA não dorme. Você pode.
          </p>
        </div>
      </div>
    </div>
  );
}
