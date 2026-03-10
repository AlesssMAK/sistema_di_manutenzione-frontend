import { User } from '@/types/user';
import { create } from 'zustand';

type AuthStore = {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  setUser: (user: User) => void;
  setLoading: (value: boolean) => void;
  clearIsAuthenticated: () => void;
};

export const useAuthStore = create<AuthStore>(set => ({
  isAuthenticated: false,
  loading: true,
  user: null,
  setUser: (user: User) => {
    set(() => ({ user, isAuthenticated: true }));
  },
  setLoading: value => set(() => ({ loading: value })),
  clearIsAuthenticated: () => {
    set(() => ({ user: null, isAuthenticated: false }));
  },
}));
