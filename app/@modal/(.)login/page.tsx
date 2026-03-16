'use client';

import LoginForm from '@/components/forms/LoginForm/LoginForm';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';

const Login = () => {
  const router = useRouter();

  const close = () => {
    const user = useAuthStore.getState().user;

    if (window.history.length > 1) router.back();
    else router.replace('/');

    requestAnimationFrame(() => {
      if (user?.role === 'admin') {
        router.push('/admin');
      }
    });
  };

  return (
    <div>
      <LoginForm onClose={close} />
    </div>
  );
};

export default Login;
