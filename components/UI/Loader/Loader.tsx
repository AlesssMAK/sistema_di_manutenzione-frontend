'use client';

import { useTranslations } from 'next-intl';
import css from './Loader.module.css';

export default function Loader() {
  const t = useTranslations('loader');
  return (
    <div className={css.wrap}>
      <div className={css.spinner} />
      <p className={css.text}>{t('loading')}</p>
    </div>
  );
}
