'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Input from '@/components/UI/Input/Input';
import Button from '@/components/UI/Button/Button';
import { resetPassword } from '@/lib/api/auth';
import { ApiError } from '@/app/api/api';
import css from '../LoginForm/LoginForm.module.css';

// Mirrors the backend policy: 8+ chars, lower, upper, special. The
// backend Joi rule is authoritative — this just gives instant feedback.
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

const ResetPasswordForm = () => {
  const t = useTranslations('login');
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) return setError(t('passwordReset.missingToken'));
    if (!STRONG_PASSWORD.test(password))
      return setError(t('passwordReset.policy'));
    if (password !== confirm) return setError(t('passwordReset.mismatch'));

    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success(t('passwordReset.success'));
      router.push('/login');
    } catch (err) {
      const status = (err as ApiError)?.response?.status;
      setError(
        status === 400
          ? t('passwordReset.invalidToken')
          : t('passwordReset.genericError')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={css.login_container}>
      <h1 className={css.logit_title}>{t('passwordReset.resetTitle')}</h1>
      <p className={css.logit_subtitle}>{t('passwordReset.resetSubtitle')}</p>

      <form onSubmit={onSubmit} className={css.form}>
        <div className={css.inputs_container}>
          <div className={css.input_container}>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('passwordReset.newPasswordPlaceholder')}
              style={{ height: '52px' }}
              required
            />
          </div>
          <div className={css.input_container}>
            <Input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={t('passwordReset.confirmPasswordPlaceholder')}
              style={{ height: '52px' }}
              required
            />
          </div>
        </div>

        <p className={css.logit_subtitle}>{t('passwordReset.policy')}</p>
        {error && <p className={css.form_error}>{error}</p>}

        <div className={css.btn_container}>
          <Link href="/login" className="button button--white">
            {t('passwordReset.backToLogin')}
          </Link>
          <Button
            type="submit"
            className="button button--blue"
            width="100%"
            height={44}
            disabled={loading}
          >
            {t('passwordReset.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;
