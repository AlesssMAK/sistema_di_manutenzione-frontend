'use client';

import { useTranslations } from 'next-intl';
import css from './OperatorPage.module.css';
import { usePageStore } from '@/lib/store/pageStore';
import { useEffect } from 'react';
import ReportForm from '@/components/forms/ReportForm/ReportForm';

const OperatorPageClient = () => {
  const t = useTranslations('OperatorPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, []);
  return (
    <main>
      <section className="section">
        <div className="container">
          <ReportForm />
        </div>
      </section>
    </main>
  );
};

export default OperatorPageClient;
