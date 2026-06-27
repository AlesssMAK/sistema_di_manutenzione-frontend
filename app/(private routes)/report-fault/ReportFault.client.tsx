'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageStore } from '@/lib/store/pageStore';
import ReportForm from '@/components/forms/ReportForm/ReportForm';
import css from './page.module.css';

const ReportFaultClient = () => {
  const t = useTranslations('ReportFaultPage');
  const tDetail = useTranslations('FaultDetail');
  const router = useRouter();
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, [setPageTitle, t]);

  return (
    <div className="container">
      <div className={css.pageWrapper}>
        <button
          type="button"
          className={css.backButton}
          onClick={() => router.back()}
          title={tDetail('backButton')}
          aria-label={tDetail('backButton')}
        >
          <svg width="20" height="20" aria-hidden="true">
            <use href="/sprite.svg#arrow_back_ios_new" />
          </svg>
        </button>
        <ReportForm />
      </div>
    </div>
  );
};

export default ReportFaultClient;
