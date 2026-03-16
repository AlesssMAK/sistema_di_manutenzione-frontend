'use client';

import { usePageStore } from '@/lib/store/pageStore';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

const MaintenanceWorkerClient = () => {
  const t = useTranslations('maintenanceWorkerPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, []);
  return <div>MaintenanceWorkerClient</div>;
};

export default MaintenanceWorkerClient;
