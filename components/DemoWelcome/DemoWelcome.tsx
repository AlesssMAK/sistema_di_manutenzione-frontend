'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/UI/Modal/Modal';
import css from './DemoWelcome.module.css';

// First-visit intro for the public demo. Shown once per browser
// (localStorage), then dismissed. Rendered from the root layout only
// when IS_DEMO.
const STORAGE_KEY = 'mms-demo-welcome-dismissed';

const DemoWelcome = () => {
  const t = useTranslations('Demo');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    setOpen(true);
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Modal onClose={close}>
      <div className={css.content}>
        <h2 className={css.title}>{t('welcomeTitle')}</h2>
        <p className={css.body}>{t('welcomeBody')}</p>
        <button
          type="button"
          className={`button button--blue ${css.cta}`}
          onClick={close}
        >
          {t('welcomeCta')}
        </button>
      </div>
    </Modal>
  );
};

export default DemoWelcome;
