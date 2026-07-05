import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm/ForgotPasswordForm';
import css from '../login/Login.module.css';

const ForgotPasswordPage = () => {
  return (
    <div className={`${css.login_container} container`}>
      <ForgotPasswordForm />
    </div>
  );
};

export default ForgotPasswordPage;
