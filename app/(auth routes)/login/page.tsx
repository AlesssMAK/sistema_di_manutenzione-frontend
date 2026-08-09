import LoginForm from '@/components/forms/LoginForm/LoginForm';
import DemoRolePicker from '@/components/DemoRolePicker/DemoRolePicker';
import { IS_DEMO } from '@/lib/config/demo';
import css from './Login.module.css';

const Login = () => {
  // In the public demo the login wall is replaced by a role picker.
  if (IS_DEMO) {
    return <DemoRolePicker />;
  }

  return (
    <div className={`${css.login_container} container`}>
      <LoginForm />
    </div>
  );
};

export default Login;
