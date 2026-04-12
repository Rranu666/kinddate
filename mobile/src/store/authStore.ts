import { create } from 'zustand';
import { supabase, getProfile } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthStore {
  user: Profile | null;
  userId: string | null;
  loading: boolean;
  initialized: boolean;

  setUser: (user: Profile | null) => void;
  setUserId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  refreshProfile: () => Promise<void>;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  userId: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setUserId: (userId) => set({ userId }),
  setLoading: (loading) => set({ loading }),

  refreshProfile: async () => {
    const { userId } = get();
    if (!userId) return;

    const { data, error } = await getProfile(userId);
    if (!error && data) {
      set({ user: data as Profile });
    }
  },

  initialize: async () => {
    set({ loading: true });

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      set({ userId: session.user.id });
      const { data } = await getProfile(session.user.id);
      if (data) set({ user: data as Profile });
    }

    set({ loading: false, initialized: true });

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ userId: session.user.id });
        const { data } = await getProfile(session.user.id);
        if (data) set({ user: data as Profile });
      } else {
        set({ user: null, userId: null });
      }
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, userId: null });
  },
}));
