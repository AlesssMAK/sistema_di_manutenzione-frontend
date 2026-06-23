'use client';

import { checkSession } from '@/lib/api/auth';
import { getMe } from '@/lib/api/users';
import { useAuthStore } from '@/lib/store/authStore';
import { useEffect } from 'react';

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const setLoading = useAuthStore(state => state.setLoading);
  const setUser = useAuthStore(state => state.setUser);
  const clearIsAuthenticated = useAuthStore(
    state => state.clearIsAuthenticated
  );

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const isAuthenticated = await checkSession();
        if (!isAuthenticated) {
          clearIsAuthenticated();
          return;
        }
        const user = await getMe();
        if (user) {
          setUser(user);
        } else {
          clearIsAuthenticated();
        }
      } catch {
        // Any failure (network, unexpected throw) = treat as no
        // session rather than leaving an unhandled rejection.
        clearIsAuthenticated();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [setLoading, setUser, clearIsAuthenticated]);

  return children;
};

export default AuthProvider;
