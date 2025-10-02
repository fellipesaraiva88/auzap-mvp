function Sidebar({ currentPage, onPageChange }) {
  try {
    const menuItems = [
      {
        id: 'dashboard',
        icon: 'gauge',
        label: 'Impacto',
        description: 'Seu tempo recuperado'
      },
      {
        id: 'conversas',
        icon: 'message-circle',
        label: 'Conversas',
        description: 'IA + você'
      },
      {
        id: 'clientes',
        icon: 'users',
        label: 'Clientes',
        description: 'Pessoas & pets'
      },
      {
        id: 'agenda',
        icon: 'calendar',
        label: 'Agenda',
        description: 'Horários'
      },
      {
        id: 'vendas',
        icon: 'shopping-bag',
        label: 'Vendas',
        description: 'Produtos'
      },
      {
        id: 'ia',
        icon: 'cpu',
        label: 'IA',
        description: 'Configurar'
      }
    ];

    return (
      <aside className="w-72 glass-card min-h-screen p-6 flex flex-col" data-name="sidebar" data-file="components/Sidebar.js">
        {/* Logo e Branding */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center">
              <i class="lucide lucide-paw-print text-white text-2xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-black">
                <span className="text-gradient">AuZap</span>
              </h1>
              <p className="text-xs text-[var(--text-muted)]">IA que trabalha por você</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                ${currentPage === item.id
                  ? 'bg-[var(--primary-color)] text-white shadow-lg'
                  : 'text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)]'
                }
              `}
            >
              <i class={`lucide lucide-${item.icon} text-xl`}></i>
              <div className="flex-1 text-left">
                <div className="font-semibold">{item.label}</div>
                <div className={`text-xs ${currentPage === item.id ? 'text-blue-100' : 'text-[var(--text-muted)]'}`}>
                  {item.description}
                </div>
              </div>
            </button>
          ))}
        </nav>

        {/* Bottom Section - Status da IA */}
        <div className="mt-auto pt-6 border-t border-[var(--glass-border)]">
          <div className="glass-card p-4 border-2 border-green-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-[var(--text-primary)]">IA Ativa</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Trabalhando agora: 3 conversas
            </p>
          </div>

          {/* User Profile */}
          <div className="mt-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">PS</span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[var(--text-primary)] text-sm">Pet Shop Exemplo</div>
              <div className="text-xs text-[var(--text-muted)]">Plano Pro</div>
            </div>
          </div>
        </div>
      </aside>
    );
  } catch (error) {
    console.error('Sidebar component error:', error);
    return null;
  }
}