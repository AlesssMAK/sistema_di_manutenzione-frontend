import React from 'react';

import { useTranslations } from 'next-intl';
import { usePageStore } from '@/lib/store/pageStore';
import { useEffect } from 'react';

const ManagerClient = () => {
  const t = useTranslations('ManagerPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, []);
  return <div>ManagerClient</div>;
};

export default ManagerClient;
