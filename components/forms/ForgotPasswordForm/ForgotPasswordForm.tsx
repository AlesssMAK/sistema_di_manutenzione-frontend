'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Input from '@/components/UI/Input/Input';
import Button from '@/components/UI/Button/Button';
import { forgotPassword } from '@/lib/api/auth';
import css from '../LoginForm/LoginForm.module.css';
import { useRouter } from 'next/navigation';

const ForgotPasswordForm = () => {
  const t = useTranslations('login');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      // Backend always answers with a generic success — show it either way.
      setSent(true);
    } catch {
      // Only a network / 500 reaches here (the BE never 4xx's on unknown
      // emails), so surface a generic error.
      toast.error(t('passwordReset.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={css.login_container}>
      <h1 className={css.logit_title}>{t('passwordReset.forgotTitle')}</h1>
      <p className={css.logit_subtitle}>{t('passwordReset.forgotSubtitle')}</p>

      {sent ? (
        <div className={css.form}>
          <p className={css.logit_subtitle}>{t('passwordReset.sent')}</p>
          <Link href="/login" className="button button--blue">
            {t('passwordReset.backToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className={css.form}>
          <div className={css.inputs_container}>
            <div className={css.input_container}>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('passwordReset.emailPlaceholder')}
                style={{ height: '52px' }}
                required
              />
            </div>
          </div>
          <div className={css.btn_container}>
            <Button
              type="button"
              className="button button--white"
              width="100%"
              height={44}
              disabled={loading}
              onClick={() => {
                router.push('/login');
              }}
            >
              {t('passwordReset.backToLogin')}
            </Button>
            <Button
              type="submit"
              className="button button--blue"
              width="100%"
              height={44}
              disabled={loading}
            >
              {t('passwordReset.sendLink')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
