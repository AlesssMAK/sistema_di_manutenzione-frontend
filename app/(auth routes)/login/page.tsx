import LoginForm from '@/components/forms/LoginForm/LoginForm';
import css from './Login.module.css';

const Login = () => {
  return (
    <div className={`${css.login_container} container`}>
      <LoginForm />
    </div>
  );
};

export default Login;
