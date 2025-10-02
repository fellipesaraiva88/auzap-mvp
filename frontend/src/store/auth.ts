import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Organization } from '@/types';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organization: null,
  isLoading: true,
  
  setUser: (user) => set({ user, isLoading: false }),
  
  setOrganization: (organization) => set({ organization }),
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, organization: null });
  },
}));
