'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store/authStore';
import { usePageStore } from '@/lib/store/pageStore';
import BachecaColumn from '@/components/Bacheca/BachecaColumn/BachecaColumn';
import css from './Bacheca.module.css';

const BachecaClient = () => {
  const t = useTranslations('BachecaPage');
  const { user } = useAuthStore();
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('title'));
  }, [setPageTitle, t]);

  const canCreate =
    user?.role === 'admin' ||
    user?.permissions?.canCreateAnnouncements === true;

  return (
    <main className={css.main}>
      <div className="container">
        <BachecaColumn
          category="announcement"
          canCreate={canCreate}
          withSeverity
          gridLayout
        />
      </div>
    </main>
  );
};

export default BachecaClient;
