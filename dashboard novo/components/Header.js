function Header() {
  try {
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000); // Atualiza a cada minuto

      return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };

    const formatDate = (date) => {
      return date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const getGreeting = () => {
      const hour = currentTime.getHours();
      if (hour < 12) return 'Bom dia';
      if (hour < 18) return 'Boa tarde';
      return 'Boa noite';
    };

    return (
      <header className="bg-white border-b border-[var(--border-color)] px-6 py-4" data-name="header" data-file="components/Header.js">
        <div className="flex items-center justify-between">
          {/* Saudação */}
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {getGreeting()}, Maria! 👋
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              A IA já atendeu <span className="font-semibold text-[var(--accent-color)]">23 clientes</span> hoje!
            </p>
          </div>

          {/* Data e Ações Rápidas */}
          <div className="flex items-center space-x-6">
            {/* Data e Hora */}
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {formatTime(currentTime)}
              </p>
              <p className="text-xs text-[var(--text-secondary)] capitalize">
                {formatDate(currentTime)}
              </p>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center space-x-3">
              <button className="btn-secondary flex items-center space-x-2">
                <div className="icon-message-plus text-sm"></div>
                <span className="hidden sm:inline">Nova Conversa</span>
              </button>
              
              <button className="btn-secondary flex items-center space-x-2">
                <div className="icon-calendar-plus text-sm"></div>
                <span className="hidden sm:inline">Agendar</span>
              </button>
              
              <button className="btn-primary flex items-center space-x-2">
                <div className="icon-plus text-sm"></div>
                <span className="hidden sm:inline">Cadastrar Pet</span>
              </button>
            </div>

            {/* Notificações */}
            <button className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <div className="icon-bell text-lg"></div>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>
      </header>
    );
  } catch (error) {
    console.error('Header component error:', error);
    return null;
  }
}