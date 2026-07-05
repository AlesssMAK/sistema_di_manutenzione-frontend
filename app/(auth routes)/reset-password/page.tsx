import { Suspense } from 'react';
import ResetPasswordForm from '@/components/forms/ResetPasswordForm/ResetPasswordForm';
import css from '../login/Login.module.css';

const ResetPasswordPage = () => {
  return (
    <div className={`${css.login_container} container`}>
      {/* useSearchParams (reads ?token=) needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
};

export default ResetPasswordPage;
