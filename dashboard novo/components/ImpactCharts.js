function ImpactCharts() {
  try {
    const chartsData = mockData.chartsData;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-name="impact-charts" data-file="components/ImpactCharts.js">
        {/* Trabalho que Você NÃO Precisou Fazer */}
        <div className="card">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">
            📈 Quanto do Trabalho Você NÃO Precisou Fazer
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">IA resolveu sozinha</span>
              <span className="font-bold text-[var(--accent-color)]">{chartsData.workAutomation.aiHandled}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-[var(--accent-color)] h-4 rounded-full relative"
                style={{ width: `${chartsData.workAutomation.aiHandled}%` }}
              >
                <div className="absolute right-2 top-0 h-4 flex items-center">
                  <div className="icon-cpu text-xs text-white"></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Você entrou em ação</span>
              <span className="font-bold text-[var(--primary-color)]">{chartsData.workAutomation.humanIntervention}%</span>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 A cada 10 clientes, você só precisou aparecer em {chartsData.workAutomation.humanIntervention}. 
                Os outros {chartsData.workAutomation.aiHandled}? IA resolveu enquanto você tocava o negócio.
              </p>
            </div>
          </div>
        </div>

        {/* Dinheiro Trabalhando Por Você */}
        <div className="card">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">
            💰 Dinheiro Trabalhando Por Você (24h)
          </h3>
          
          <div className="space-y-3">
            {chartsData.hourlyRevenue.map((hour, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-sm font-mono w-8 text-[var(--text-secondary)]">
                  {hour.time}
                </span>
                <div className="flex-1 bg-gray-200 rounded h-6 relative">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-6 rounded flex items-center justify-end pr-2"
                    style={{ width: `${(hour.value / 850) * 100}%` }}
                  >
                    <span className="text-xs text-white font-bold">
                      R$ {hour.value}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-4 bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <p className="text-sm text-indigo-800">
                🌙 Até de madrugada: R$ 180 (02h-06h) - IA fechando vendas enquanto você dormia
              </p>
            </div>
          </div>
        </div>

        {/* Seu Potencial Sendo Usado */}
        <div className="card lg:col-span-2">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">
            🏨 Seu Potencial Sendo Usado
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chartsData.capacityUsage.map((service, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--text-primary)]">
                    {service.name}
                  </span>
                  <span className="text-lg font-bold" style={{ color: service.color }}>
                    {service.percentage}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full"
                    style={{ 
                      width: `${service.percentage}%`,
                      backgroundColor: service.color
                    }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">
                    {service.occupied}/{service.total} vagas
                  </span>
                  <span className="font-bold text-[var(--accent-color)]">
                    R$ {service.dailyRevenue}/dia
                  </span>
                </div>
                
                {service.percentage < 100 && (
                  <div className="bg-orange-50 rounded p-3 border border-orange-200">
                    <p className="text-xs text-orange-800">
                      💡 Você está deixando {100 - service.percentage}% na mesa. 
                      Quer que a IA faça campanha de ocupação?
                    </p>
                  </div>
                )}
                
                {service.percentage === 100 && (
                  <div className="bg-green-50 rounded p-3 border border-green-200">
                    <p className="text-xs text-green-800">
                      🎉 {service.waitingList ? 'Cheio! Fila de espera' : 'Capacidade máxima!'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ImpactCharts component error:', error);
    return null;
  }
}