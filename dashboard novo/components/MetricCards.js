function MetricCards() {
  try {
    const metricsData = mockData.metricsData;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-name="metric-cards" data-file="components/MetricCards.js">
        {/* Dinheiro em Movimento */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="icon-trending-up text-xl text-green-600"></div>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Dinheiro em</h3>
                <p className="text-sm text-[var(--text-secondary)]">Movimento</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold text-green-600">
              R$ {metricsData.moneyInMotion.value}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {metricsData.moneyInMotion.conversations} conversas acontecendo
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <div className="icon-cpu text-xs text-white"></div>
              </div>
              <span className="text-xs text-green-600 font-medium">IA gerenciando</span>
            </div>
          </div>
        </div>

        {/* Receita Garantida */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="icon-target text-xl text-blue-600"></div>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Receita</h3>
                <p className="text-sm text-[var(--text-secondary)]">Garantida</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold text-blue-600">
              R$ {metricsData.guaranteedRevenue.value}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {metricsData.guaranteedRevenue.scheduled} agendados esta semana
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="icon-calendar text-xs text-white"></div>
              </div>
              <span className="text-xs text-blue-600 font-medium">Caixa futuro</span>
            </div>
          </div>
        </div>

        {/* Potencial Sendo Usado */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="icon-zap text-xl text-purple-600"></div>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Potencial</h3>
                <p className="text-sm text-[var(--text-secondary)]">Sendo Usado</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold text-purple-600">
              🏨 {metricsData.capacityUsage.percentage}%
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {metricsData.capacityUsage.occupied}/{metricsData.capacityUsage.total} vagas ocupadas
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                <div className="icon-chart-bar text-xs text-white"></div>
              </div>
              <span className="text-xs text-purple-600 font-medium">Taxa ótima</span>
            </div>
          </div>
        </div>

        {/* Você Estava Livre */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <div className="icon-clock text-xl text-orange-600"></div>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Você estava</h3>
                <p className="text-sm text-[var(--text-secondary)]">Livre</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold text-orange-600">
              {metricsData.freeTime.hours}h {metricsData.freeTime.minutes}min
            </div>
            <p className="text-sm text-[var(--text-secondary)]">hoje</p>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                <div className="icon-cpu text-xs text-white"></div>
              </div>
              <span className="text-xs text-orange-600 font-medium">IA trabalhando</span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('MetricCards component error:', error);
    return null;
  }
}

