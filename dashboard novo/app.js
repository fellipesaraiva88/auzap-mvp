class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Algo deu errado</h1>
            <p className="text-gray-600 mb-4">Desculpe, algo inesperado aconteceu.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  try {
    const [currentPage, setCurrentPage] = React.useState('dashboard');

    const renderContent = () => {
      switch(currentPage) {
        case 'dashboard':
          return (
            <div className="space-y-6" data-name="dashboard-content" data-file="app.js">
              <ImpactPanel />
              <AIInAction />
            </div>
          );
        case 'conversas':
          return (
            <div className="card" data-name="conversas-content" data-file="app.js">
              <h2 className="text-2xl font-bold mb-4">💬 Central de Conversas</h2>
              <p className="text-gray-600">Em breve: Interface completa de conversas com IA</p>
            </div>
          );
        case 'agenda':
          return (
            <div className="card" data-name="agenda-content" data-file="app.js">
              <h2 className="text-2xl font-bold mb-4">📅 Agenda</h2>
              <p className="text-gray-600">Em breve: Sistema de agendamentos integrado</p>
            </div>
          );
        case 'clientes':
          return (
            <div className="card" data-name="clientes-content" data-file="app.js">
              <h2 className="text-2xl font-bold mb-4">👥 Clientes & Pets</h2>
              <p className="text-gray-600">Em breve: Gestão completa de clientes e pets</p>
            </div>
          );
        case 'vendas':
          return (
            <div className="card" data-name="vendas-content" data-file="app.js">
              <h2 className="text-2xl font-bold mb-4">💰 Vendas</h2>
              <p className="text-gray-600">Em breve: Sistema de vendas e produtos</p>
            </div>
          );
        case 'ia':
          return (
            <div className="card" data-name="ia-content" data-file="app.js">
              <h2 className="text-2xl font-bold mb-4">🤖 Configuração da IA</h2>
              <p className="text-gray-600">Em breve: Configurações avançadas da IA</p>
            </div>
          );
        case 'ajustes':
          return (
            <div className="card" data-name="ajustes-content" data-file="app.js">
              <h2 className="text-2xl font-bold mb-4">⚙️ Ajustes</h2>
              <p className="text-gray-600">Em breve: Configurações gerais do sistema</p>
            </div>
          );
        default:
          return (
            <div className="card" data-name="default-content" data-file="app.js">
              <h2 className="text-2xl font-bold mb-4">Página não encontrada</h2>
            </div>
          );
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex" data-name="app" data-file="app.js">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);