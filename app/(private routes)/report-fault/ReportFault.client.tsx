'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePageStore } from '@/lib/store/pageStore';
import ReportForm from '@/components/forms/ReportForm/ReportForm';
import css from './page.module.css';

const ReportFaultClient = () => {
  const t = useTranslations('ReportFaultPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, [setPageTitle, t]);

  return (
    <div className="container">
      <div className={css.pageWrapper}>
        <h2 className="title">{t('title')}</h2>
        <p className="subtitle">{t('subtitle')}</p>

        <div className={css.formWrap}>
          <ReportForm />
        </div>
      </div>
    </div>
  );
};

export default ReportFaultClient;
