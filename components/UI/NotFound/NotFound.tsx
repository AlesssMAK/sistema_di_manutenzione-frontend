'use client';

import Link from 'next/link';
import css from './NotFound.module.css';
import { useTranslations } from 'next-intl';

const NotFound = () => {
  const t = useTranslations('NotFound');
  return (
    <section>
      <div className={css.error}>
        <h1>404</h1>
        <h2>{t('title')}</h2>
        <p>{t('description')}</p>
        <Link href="/" className="button button--blue">
          {t('backHome')}
        </Link>
      </div>
    </section>
  );
};

export default NotFound;
