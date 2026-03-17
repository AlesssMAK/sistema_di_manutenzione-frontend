'use client';

import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import { login } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';
import {
  createLoginSchema,
  isEmail,
  isPersonalCode,
  LoginFormData,
} from '@/lib/validation/loginValidation';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import css from './LoginForm.module.css';
import { useRouter } from 'next/navigation';
import { roleRoutes } from '@/constants/roleRoutes';

const LoginForm = () => {
  const t = useTranslations('login');
  const schema = createLoginSchema(t);
  const setUser = useAuthStore(state => state.setUser);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onLoginSubmit = async (value: LoginFormData) => {
    const { identifier, secret } = value;

    const payload: any = {};

    console.log(payload);

    if (isEmail(identifier)) {
      payload.email = identifier;
    } else {
      payload.fullName = identifier;
    }

    if (isPersonalCode(secret)) {
      payload.personalCode = secret;
    } else {
      payload.password = secret;
    }

    const { user } = await login(payload);
    setUser(user);

    const routes = roleRoutes[user.role];
    const route = routes[0] ?? '/login';
    router.push(`${route}`);

    reset();
  };

  const onClose = () => {
    router.back();
  };

  return (
    <div className={css.login_container}>
      <h1 className={css.logit_title}>{t('title')}</h1>
      <p className={css.logit_subtitle}>{t('subtitle')}</p>
      <form onSubmit={handleSubmit(onLoginSubmit)} className={css.form}>
        <div className={css.input_container}>
          <p>{t('inputIdentifier')}</p>
          <Input
            {...register('identifier')}
            type="text"
            placeholder={t('placeholderEmailOrFullName')}
          />
        </div>
        <div className={css.input_container}>
          <p>{t('inputSecret')}</p>
          <Input
            {...register('secret')}
            type="password"
            placeholder={t('placeholderPasswordOrPersonalCode')}
          />
        </div>
        <div className={css.btn_container}>
          <Button
            type="button"
            className="button button--white"
            width="100%"
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" className="button button--blue" width="100%">
            {t('submit')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
