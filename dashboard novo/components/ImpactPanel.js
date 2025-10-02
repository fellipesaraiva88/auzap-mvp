function ImpactPanel() {
  try {
    const [expanded, setExpanded] = React.useState(false);
    const impactData = mockData.impactData;

    return (
      <div className="space-y-6 slide-up" data-name="impact-panel" data-file="components/ImpactPanel.js">
        {/* SEU TEMPO RECUPERADO - Hero Section */}
        <div className="hero-card">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-3">
              <span className="text-gradient">🎯 SEU TEMPO RECUPERADO</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)]">Últimos 7 dias</p>
          </div>

          {/* Tempo Principal - Destaque Máximo */}
          <div className="glass-card p-10 text-center mb-8 pulse-glow">
            <div className="text-7xl font-black mb-4">
              <span className="text-gradient">⏰ {impactData.timeRecovered}</span>
            </div>
            <p className="text-2xl text-[var(--text-primary)] font-semibold mb-2">
              A IA trabalhou no seu lugar
            </p>
            <p className="text-lg text-[var(--text-secondary)]">
              Enquanto você tocava o negócio ou descansava
            </p>
          </div>

          {/* O Que Isso Significa - Grid Impacto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Dinheiro Economizado */}
            <div className="neuro-card text-center">
              <div className="text-5xl font-bold mb-3">
                <span className="text-gradient-warm">💵 R$ {impactData.moneySaved}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Em valor de hora-trabalho<br/>que você NÃO precisou gastar*
              </p>
            </div>

            {/* Vendas Fechadas */}
            <div className="neuro-card text-center">
              <div className="text-5xl font-bold text-blue-600 mb-3">
                🎯 {impactData.salesClosed}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Vendas fechadas pela IA<br/>100% sozinha
              </p>
            </div>

            {/* Dias de Trabalho */}
            <div className="neuro-card text-center">
              <div className="text-5xl font-bold text-purple-600 mb-3">
                😴 {impactData.workDays}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Dias de trabalho que você<br/>NÃO precisou fazer este mês
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] text-center">
            * Baseado em R$ 45/hora (salário médio atendente pet shop)
          </p>
        </div>

        {/* ENQUANTO VOCÊ DORMIA - Seção Especial */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              🌙 ENQUANTO VOCÊ DORMIA
            </h2>
            <span className="text-sm text-[var(--text-muted)]">Última noite (22h às 8h)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="lucide lucide-check text-white text-sm"></i>
                </div>
                <span className="text-[var(--text-primary)] font-medium">8 clientes atendidos</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="lucide lucide-check text-white text-sm"></i>
                </div>
                <span className="text-[var(--text-primary)] font-medium">3 agendamentos confirmados para hoje</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="lucide lucide-check text-white text-sm"></i>
                </div>
                <span className="text-[var(--text-primary)] font-medium">2 vendas de ração fechadas (R$ 340)</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="lucide lucide-check text-white text-sm"></i>
                </div>
                <span className="text-[var(--text-primary)] font-medium">12 follow-ups enviados automaticamente</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-2 border-blue-200">
            <p className="text-center text-lg font-semibold">
              <span className="text-gradient">💡 A IA não dorme. Você pode.</span>
            </p>
          </div>
        </div>

        {/* MÁQUINA DE RESULTADOS - Seção Expansível */}
        <div className="card">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
          >
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              🚀 MÁQUINA DE RESULTADOS
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[var(--text-secondary)]">
                {expanded ? 'Recolher' : 'Ver detalhes'}
              </span>
              <i class={`lucide lucide-chevron-${expanded ? 'up' : 'down'} text-[var(--text-secondary)]`}></i>
            </div>
          </button>

          {/* Preview quando collapsed */}
          {!expanded && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">82%</div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">IA Resolveu</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600">R$ 3.2k</div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Em Movimento</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600">80%</div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Ocupação</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-3xl font-bold text-orange-600">4h 23m</div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Você Livre</p>
              </div>
            </div>
          )}

          {/* Conteúdo expandido */}
          {expanded && (
            <div className="space-y-6 mt-6">
              {/* Trabalho Automatizado */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                  📊 Quanto do Trabalho a IA Fez Por Você
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">IA resolveu sozinha</span>
                    <span className="font-bold text-2xl text-[var(--accent-color)]">82%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="h-6 rounded-full flex items-center justify-end pr-3"
                      style={{
                        width: '82%',
                        background: 'var(--gradient-success)'
                      }}
                    >
                      <i class="lucide lucide-cpu text-white text-sm"></i>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">Você entrou em ação</span>
                    <span className="font-bold text-xl text-[var(--primary-color)]">18%</span>
                  </div>

                  <div className="glass-card p-4 border-2 border-blue-200">
                    <p className="text-sm text-blue-800">
                      💡 A cada 10 clientes, você só precisou aparecer em <strong>2</strong>.
                      Os outros <strong>8</strong>? IA resolveu enquanto você tocava o negócio.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dinheiro 24h */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                  💰 Dinheiro Trabalhando Por Você (24h)
                </h3>

                <div className="space-y-3">
                  {mockData.chartsData.hourlyRevenue.map((hour, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <span className="text-sm font-mono w-10 text-[var(--text-secondary)] font-semibold">
                        {hour.time}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-lg h-8 relative overflow-hidden">
                        <div
                          className="h-8 rounded-lg flex items-center justify-end pr-3"
                          style={{
                            width: `${(hour.value / 850) * 100}%`,
                            background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                          }}
                        >
                          <span className="text-xs text-white font-bold">
                            R$ {hour.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="glass-card p-4 border-2 border-indigo-200 mt-4">
                    <p className="text-sm text-indigo-800">
                      🌙 Até de madrugada: <strong>R$ 180 (02h-06h)</strong> - IA fechando vendas enquanto você dormia
                    </p>
                  </div>
                </div>
              </div>

              {/* Capacidade */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                  🏨 Seu Potencial Sendo Usado
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockData.chartsData.capacityUsage.map((service, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {service.name}
                        </span>
                        <span className="text-2xl font-bold" style={{ color: service.color }}>
                          {service.percentage}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="h-4 rounded-full"
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
                        <div className="glass-card p-3 border-2 border-orange-200">
                          <p className="text-xs text-orange-800">
                            💡 Você está deixando <strong>{100 - service.percentage}%</strong> na mesa.
                            Quer que a IA faça campanha de ocupação?
                          </p>
                        </div>
                      )}

                      {service.percentage === 100 && (
                        <div className="glass-card p-3 border-2 border-green-200">
                          <p className="text-xs text-green-800 font-semibold">
                            🎉 {service.waitingList ? 'Cheio! Fila de espera ativa' : 'Capacidade máxima atingida!'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('ImpactPanel component error:', error);
    return null;
  }
}
