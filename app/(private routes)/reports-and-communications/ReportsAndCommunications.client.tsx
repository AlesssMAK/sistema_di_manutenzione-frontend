'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePageStore } from '@/lib/store/pageStore';
import RecentFaultsList from '@/components/Reports/RecentFaultsList/RecentFaultsList';
import BroadcastsList from '@/components/Reports/BroadcastsList/BroadcastsList';
import css from './page.module.css';

const ReportsAndCommunicationsClient = () => {
  const t = useTranslations('reportsAndCommunicationsPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, [setPageTitle, t]);

  return (
    <div className="container">
      <div className={css.pageWrapper}>
        <h2 className="title">{t('title')}</h2>
        <p className="subtitle">{t('subtitle')}</p>

        <div className={css.dashboard}>
          <section className={css.section}>
            <header className={css.sectionHeader}>
              <h3 className={css.sectionTitle}>
                {t('sections.recentFaults.title')}
              </h3>
              <p className={css.sectionSubtitle}>
                {t('sections.recentFaults.subtitle')}
              </p>
            </header>
            <div className={css.sectionBody}>
              <RecentFaultsList />
            </div>
          </section>

          <section className={css.section}>
            <header className={css.sectionHeader}>
              <h3 className={css.sectionTitle}>
                {t('sections.broadcasts.title')}
              </h3>
              <p className={css.sectionSubtitle}>
                {t('sections.broadcasts.subtitle')}
              </p>
            </header>
            <div className={css.sectionBody}>
              <BroadcastsList />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReportsAndCommunicationsClient;
