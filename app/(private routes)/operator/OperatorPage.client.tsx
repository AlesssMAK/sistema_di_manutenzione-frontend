'use client';

import { useTranslations } from 'next-intl';
import css from './OperatorPage.module.css';
import { usePageStore } from '@/lib/store/pageStore';
import { useEffect } from 'react';

const OperatorPageClient = async () => {
  const t = useTranslations('OperatorPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, []);
  return (
    <main>
      <section className="section">
        <div className="container">
          <h1 className={css.title}>Nuova Segnalazione</h1>
          <p className={css.text}>
            Compila il modulo per segnalare un guasto o anomalia
          </p>
          {/* <SegnalazioneForm /> */}
        </div>
      </section>
    </main>
  );
};

export default OperatorPageClient;
