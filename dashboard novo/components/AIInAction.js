function AIInAction() {
  try {
    const [actions, setActions] = React.useState([
      {
        id: 1,
        type: 'conversation',
        icon: 'message-circle',
        color: '#3b82f6',
        client: 'Maria Silva',
        action: 'Confirmando agendamento de banho para Rex',
        time: 'Agora',
        status: 'active'
      },
      {
        id: 2,
        type: 'sale',
        icon: 'shopping-bag',
        color: '#10b981',
        client: 'João Santos',
        action: 'Fechou venda de ração Royal Canin 15kg',
        time: '2 min atrás',
        status: 'completed'
      },
      {
        id: 3,
        type: 'followup',
        icon: 'send',
        color: '#f59e0b',
        client: 'Ana Costa',
        action: 'Enviando lembrete de vacina do Totó',
        time: '5 min atrás',
        status: 'completed'
      }
    ]);

    const [showAll, setShowAll] = React.useState(false);

    // Simula streaming de novas ações
    React.useEffect(() => {
      const interval = setInterval(() => {
        const newActions = [
          {
            type: 'conversation',
            icon: 'message-circle',
            color: '#3b82f6',
            clients: ['Pedro Lima', 'Carla Mendes', 'Roberto Alves'],
            actions: [
              'Respondendo sobre preços de tosa',
              'Agendando consulta veterinária',
              'Tirando dúvida sobre horários'
            ]
          },
          {
            type: 'sale',
            icon: 'shopping-bag',
            color: '#10b981',
            clients: ['Fernanda Costa', 'Lucas Oliveira'],
            actions: [
              'Fechou venda de shampoo profissional',
              'Vendeu pacote mensal de creche'
            ]
          },
          {
            type: 'followup',
            icon: 'send',
            color: '#f59e0b',
            clients: ['Ricardo Santos', 'Paula Dias'],
            actions: [
              'Lembrando retorno pós-cirúrgico',
              'Follow-up de orçamento não respondido'
            ]
          }
        ];

        const randomAction = newActions[Math.floor(Math.random() * newActions.length)];
        const randomClient = randomAction.clients[Math.floor(Math.random() * randomAction.clients.length)];
        const randomActionText = randomAction.actions[Math.floor(Math.random() * randomAction.actions.length)];

        setActions(prev => [
          {
            id: Date.now(),
            type: randomAction.type,
            icon: randomAction.icon,
            color: randomAction.color,
            client: randomClient,
            action: randomActionText,
            time: 'Agora',
            status: 'active'
          },
          ...prev.slice(0, 9)
        ]);

        // Atualiza status depois de 3 segundos
        setTimeout(() => {
          setActions(prev => prev.map(a =>
            a.time === 'Agora' ? { ...a, time: 'Há poucos segundos', status: 'completed' } : a
          ));
        }, 3000);
      }, 8000); // Nova ação a cada 8 segundos

      return () => clearInterval(interval);
    }, []);

    const displayedActions = showAll ? actions : actions.slice(0, 3);

    return (
      <div className="card" data-name="ai-in-action" data-file="components/AIInAction.js">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <i class="lucide lucide-zap text-white text-2xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">IA em Ação</h2>
              <p className="text-sm text-[var(--text-secondary)]">Acontecendo agora</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-red-600">AO VIVO</span>
          </div>
        </div>

        <div className="space-y-3">
          {displayedActions.map((action, index) => (
            <div
              key={action.id}
              className={`
                glass-card p-4 border-l-4 transition-all duration-500
                ${action.status === 'active' ? 'slide-up' : ''}
              `}
              style={{ borderColor: action.color }}
            >
              <div className="flex items-start space-x-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: action.color + '20' }}
                >
                  <i class={`lucide lucide-${action.icon} text-lg`} style={{ color: action.color }}></i>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[var(--text-primary)] truncate">
                      {action.client}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] ml-2 flex-shrink-0">
                      {action.time}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{action.action}</p>
                </div>

                {action.status === 'active' && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                )}

                {action.status === 'completed' && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <i class="lucide lucide-check text-white text-xs"></i>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {actions.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 btn-ghost flex items-center justify-center space-x-2"
          >
            <span>{showAll ? 'Ver menos' : `Ver todas (${actions.length})`}</span>
            <i class={`lucide lucide-chevron-${showAll ? 'up' : 'down'} text-sm`}></i>
          </button>
        )}

        {/* Resumo do que está rolando */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">
              {actions.filter(a => a.type === 'conversation').length}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Conversas</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <div className="text-2xl font-bold text-green-600">
              {actions.filter(a => a.type === 'sale').length}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Vendas</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-xl">
            <div className="text-2xl font-bold text-orange-600">
              {actions.filter(a => a.type === 'followup').length}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Follow-ups</p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AIInAction component error:', error);
    return null;
  }
}
