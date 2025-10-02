function ImpactPanel() {
  try {
    const impactData = mockData.impactData;

    return (
      <div className="impact-card" data-name="impact-panel" data-file="components/ImpactPanel.js">
        {/* Título Principal */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[var(--primary-color)] mb-2">
            🎯 SEU TEMPO RECUPERADO
          </h2>
          <p className="text-[var(--text-secondary)]">(Últimos 7 dias)</p>
        </div>

        {/* Tempo Recuperado - Destaque Principal */}
        <div className="bg-white rounded-xl p-8 text-center mb-8 shadow-lg border border-blue-200">
          <div className="text-5xl font-bold text-gradient mb-4">
            ⏰ {impactData.timeRecovered}
          </div>
          <p className="text-xl text-[var(--text-secondary)]">
            Tempo que a IA trabalhou no seu lugar
          </p>
        </div>

        {/* Separador */}
        <div className="border-t-2 border-blue-300 my-8"></div>

        {/* O Que Isso Significa */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 text-center">
            O QUE ISSO SIGNIFICA:
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 text-center border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">
                💵 R$ {impactData.moneySaved}
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Em valor de hora-trabalho economizado*
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-center border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                🎯 {impactData.salesClosed} vendas
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Fechadas pela IA sozinha
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-center border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                😴 {impactData.workDays} dias
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                De trabalho que você NÃO precisou fazer este mês
              </p>
            </div>
          </div>
          
          <p className="text-xs text-[var(--text-secondary)] text-center mt-4">
            * Baseado em R$ 45/hora (salário médio atendente)
          </p>
        </div>

        {/* Separador */}
        <div className="border-t-2 border-blue-300 my-8"></div>

        {/* Enquanto Você Dormia */}
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">
            🚀 ENQUANTO VOCÊ DORMIA (Última noite - 22h às 8h):
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-[var(--text-primary)]">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="icon-check text-xs text-white"></div>
                </div>
                <span>8 clientes atendidos</span>
              </div>
              
              <div className="flex items-center space-x-3 text-[var(--text-primary)]">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="icon-check text-xs text-white"></div>
                </div>
                <span>3 agendamentos confirmados para hoje</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-[var(--text-primary)]">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="icon-check text-xs text-white"></div>
                </div>
                <span>2 vendas de ração fechadas (R$ 340)</span>
              </div>
              
              <div className="flex items-center space-x-3 text-[var(--text-primary)]">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="icon-check text-xs text-white"></div>
                </div>
                <span>12 follow-ups enviados</span>
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
  } catch (error) {
    console.error('ImpactPanel component error:', error);
    return null;
  }
}