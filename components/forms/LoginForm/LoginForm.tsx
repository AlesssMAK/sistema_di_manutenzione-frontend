'use client';

import Input from '@/components/UI/Input/Input';
import css from './LoginForm.module.css';
import Button from '@/components/UI/Button/Button';
import { useForm } from 'react-hook-form';
import { login } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';
import Modal from '@/components/UI/Modal/Modal';
import { useTranslations } from 'next-intl';

interface LofinFormData {
  fullName: string;
  personalCode: string;
}

interface LoginFormProps {
  onClose: () => void;
}

const LoginForm = ({ onClose }: LoginFormProps) => {
  const t = useTranslations('login');
  const setUser = useAuthStore(state => state.setUser);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LofinFormData>();

  const onLoginSubmit = async (value: LofinFormData) => {
    console.log(value);
    const data = await login({
      fullName: value.fullName,
      personalCode: value.personalCode,
    });

    setUser(data.user);
    reset();
    onClose();
  };

  const { user } = useAuthStore();

  return (
    <Modal onClose={onClose}>
      <div className={css.login_container}>
        <h1 className={css.logit_title}>{t('title')}</h1>
        <p className={css.logit_subtitle}>{t('subtitleOperator')}</p>
        <form onSubmit={handleSubmit(onLoginSubmit)} className={css.form}>
          <div className={css.input_container}>
            <p>{t('fullName')}</p>
            <Input
              {...register('fullName')}
              type="text"
              placeholder={t('placeholderFullNameOperatore')}
            />
          </div>
          <div className={css.input_container}>
            <p>{t('personalCode')}</p>
            <Input
              {...register('personalCode')}
              type="password"
              placeholder={t('placeholderPersonalCodeOperatore')}
            />
          </div>
          <div className={css.btn_container}>
            <Button
              type="button"
              className="button button_white"
              width="100%"
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" className="button button_blue" width="100%">
              {t('submit')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default LoginForm;
