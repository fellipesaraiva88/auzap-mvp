import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import Bookings from './pages/Bookings';
import Clients from './pages/Clients';
import WhatsApp from './pages/WhatsApp';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  const { user, setUser, setOrganization, isLoading } = useAuthStore();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setUser(null);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUserId: string) => {
    try {
      // Load user
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (userData) {
        setUser(userData);

        // Load organization
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userData.organization_id)
          .single();

        if (orgData) {
          setOrganization(orgData);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🐾</div>
          <div className="text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
