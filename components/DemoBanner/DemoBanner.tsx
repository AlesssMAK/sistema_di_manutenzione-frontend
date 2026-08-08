'use client';

import { useTranslations } from 'next-intl';
import css from './DemoBanner.module.css';

// Slim, always-visible reminder shown at the top of every page in the
// public demo. Rendered from the root layout only when IS_DEMO.
const DemoBanner = () => {
  const t = useTranslations('Demo');

  return (
    <div className={css.banner} role="status">
      <svg className={css.icon} width="16" height="16" aria-hidden="true">
        <use href="/sprite.svg#exclamation-circle" />
      </svg>
      <span>{t('banner')}</span>
    </div>
  );
};

export default DemoBanner;
