'use client';

import { usePageStore } from '@/lib/store/pageStore';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

const AdminClient = () => {
  const t = useTranslations('AdminPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, []);

  return <div>AdminPage</div>;
};

export default AdminClient;
