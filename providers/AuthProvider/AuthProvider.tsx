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
      console.log('AUTH PROVAIDER');

      const isAuthenticated = await checkSession();
      if (isAuthenticated) {
        console.log('AUTH PROVIDER → CALLING GET ME');
        const user = await getMe();
        if (user) {
          console.log('AUTH PROVAIDER SET USER');
          setUser(user);
        }
      } else {
        setLoading(false);
        clearIsAuthenticated();
      }
    };
    fetchUser();
  }, [setLoading, setUser, clearIsAuthenticated]);

  console.log('MONT AUTH PROVAIDER');

  return children;
};

export default AuthProvider;
