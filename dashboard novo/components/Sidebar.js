function Sidebar({ currentPage, onPageChange }) {
  try {
    const menuItems = [
      { id: 'dashboard', label: 'Início', icon: 'home' },
      { id: 'conversas', label: 'Conversas', icon: 'message-circle' },
      { id: 'agenda', label: 'Agenda', icon: 'calendar' },
      { id: 'clientes', label: 'Clientes & Pets', icon: 'users' },
      { id: 'vendas', label: 'Vendas', icon: 'shopping-cart' },
      { id: 'ia', label: 'IA', icon: 'cpu' },
      { id: 'ajustes', label: 'Ajustes', icon: 'settings' }
    ];

    return (
      <div className="w-64 bg-white border-r border-[var(--border-color)] flex flex-col" data-name="sidebar" data-file="components/Sidebar.js">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[var(--primary-color)] rounded-lg flex items-center justify-center">
              <div className="icon-heart text-xl text-white"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">🐾 AuZap</h1>
              <p className="text-sm text-[var(--text-secondary)]">Pet Love Shop</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    currentPage === item.id
                      ? 'bg-[var(--primary-color)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--secondary-color)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className={`icon-${item.icon} text-lg`}></div>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Status da IA */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-green-800">IA Online</p>
              <p className="text-xs text-green-600">Atendendo clientes</p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Sidebar component error:', error);
    return null;
  }
}