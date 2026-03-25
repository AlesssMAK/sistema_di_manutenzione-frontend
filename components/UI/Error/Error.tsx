'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import css from './Error.module.css';
import { useTranslations } from 'next-intl';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  const t = useTranslations('Error');
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={css.errorPage}>
      <h1 className={css.title}>{t('errorTitle')}</h1>
      <p className={css.message}>{t('errorMessage')}</p>
      <div className={css.actions}>
        <button onClick={reset} className="button button--blue">
          {t('tryAgain')}
        </button>
        <Link href="/" className="button button--blue">
          {t('goHome')}
        </Link>
      </div>
    </div>
  );
}
