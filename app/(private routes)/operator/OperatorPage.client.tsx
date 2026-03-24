'use client';

import { useTranslations } from 'next-intl';
import css from './OperatorPage.module.css';
import { usePageStore } from '@/lib/store/pageStore';
import { useEffect } from 'react';
import { getUsers } from '@/lib/api/users';
import { getAllFaults, getFaultById } from '@/lib/api/faults';

const OperatorPageClient = () => {
  const t = useTranslations('OperatorPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    const fault = async () => {
      const fault = await getFaultById('69aa9ac213a57bf5521eb6a2');
      console.log(fault);
    };

    fault();
  }, []);

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
