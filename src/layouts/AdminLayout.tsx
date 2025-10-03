import { useEffect, useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  LayoutDashboard,
  Settings,
  LogOut,
  Activity,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  tech: 'Tech',
  cs: 'CS',
  sales: 'Sales',
  marketing: 'Marketing',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-500',
  tech: 'bg-blue-500',
  cs: 'bg-green-500',
  sales: 'bg-purple-500',
  marketing: 'bg-pink-500',
  viewer: 'bg-gray-500',
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');

    if (!token || !storedUser) {
      navigate('/admin/login');
      return;
    }

    setUser(JSON.parse(storedUser));

    // Validar token no backend
    axios
      .get(`${API_URL}/api/internal/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch(() => {
        // Token inválido
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        navigate('/admin/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    const token = localStorage.getItem('admin_token');

    // Chamar endpoint de logout (para auditoria)
    if (token) {
      axios.post(
        `${API_URL}/api/internal/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
      roles: ['super_admin', 'tech', 'cs', 'sales', 'viewer'],
    },
    {
      label: 'Clientes',
      icon: Users,
      path: '/admin/clients',
      roles: ['super_admin', 'tech', 'cs', 'sales', 'viewer'],
    },
    {
      label: 'Monitoramento',
      icon: Activity,
      path: '/admin/monitoring',
      roles: ['super_admin', 'tech'],
    },
    {
      label: 'Logs',
      icon: FileText,
      path: '/admin/logs',
      roles: ['super_admin', 'tech', 'cs'],
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      path: '/admin/analytics',
      roles: ['super_admin', 'sales', 'marketing'],
    },
    {
      label: 'Configurações',
      icon: Settings,
      path: '/admin/settings',
      roles: ['super_admin'],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  if (!user) {
    return null; // Loading ou redirect
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-ocean-blue text-xl">AuZap</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(isCollapsed && 'mx-auto')}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  'hover:bg-gray-100',
                  isActive && 'bg-ocean-blue/10 text-ocean-blue font-medium',
                  isCollapsed && 'justify-center'
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={ROLE_COLORS[user.role]}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{user.name}</p>
                    <Badge variant="outline" className="text-xs mt-0.5">
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
