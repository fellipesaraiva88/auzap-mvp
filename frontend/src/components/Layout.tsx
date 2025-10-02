import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Users,
  UserCircle,
  PawPrint,
  MessageCircle,
  Settings
} from 'lucide-react';

export default function Layout() {
  const { user, organization } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Conversas', to: '/conversations', icon: MessageSquare },
    { name: 'Agendamentos', to: '/bookings', icon: Calendar },
    { name: 'Clientes', to: '/clients', icon: Users },
    { name: 'Contatos', to: '/contacts', icon: UserCircle },
    { name: 'Pets', to: '/pets', icon: PawPrint },
    { name: 'WhatsApp', to: '/whatsapp', icon: MessageCircle },
    { name: 'Configurações', to: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🐾</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AuZap</h1>
              <p className="text-sm text-gray-500">{organization?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user?.full_name}</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
