import { User } from '@/types/userTypes';
import { create } from 'zustand';

type AuthStore = {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  setLoading: (value: boolean) => void;
  clearIsAuthenticated: () => void;
};

export const useAuthStore = create<AuthStore>(set => ({
  isAuthenticated: false,
  loading: true,
  user: null,

  setUser: user => {
    set(() => ({ user, isAuthenticated: !!user, loading: false }));
  },
  setLoading: value => set(() => ({ loading: value })),
  clearIsAuthenticated: () => {
    set(() => ({ user: null, isAuthenticated: false, loading: false }));
  },
}));
