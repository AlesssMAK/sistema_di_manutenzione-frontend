'use client';

import LoginForm from '@/components/forms/LoginForm/LoginForm';
import { useRouter } from 'next/navigation';

const Login = () => {
  const router = useRouter();

  const close = () => {
    if (window.history.length > 1) router.back();
    else router.replace('/');
  };

  return (
    <div>
      <LoginForm onClose={close} />
    </div>
  );
};

export default Login;
