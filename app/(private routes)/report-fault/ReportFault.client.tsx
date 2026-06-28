'use client';

import ReportForm from '@/components/forms/ReportForm/ReportForm';
import { usePageStore } from '@/lib/store/pageStore';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import css from './page.module.css';

const ReportFaultClient = () => {
  const t = useTranslations('ReportFaultPage');
  const tDetail = useTranslations('FaultDetail');
  const tTitle = useTranslations('ReportForm');
  const router = useRouter();
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, [setPageTitle, t]);

  return (
    <div className="container">
      <div className={css.page_wrapper}>
        <div className={css.head_container}>
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
          <div className={css.title_container}>
            <h1 className="title">{tTitle('newReport')}</h1>
            <p className="subtitle">{tTitle('fillForm')}</p>
          </div>
        </div>
        <ReportForm />
      </div>
    </div>
  );
};

export default ReportFaultClient;
