'use client';

import { useTranslations } from 'next-intl';
import { usePageStore } from '@/lib/store/pageStore';
import { useEffect } from 'react';

const SafetyClient = () => {
  const t = useTranslations('SafetyPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, []);
  return <div>SafetyClient</div>;
};

export default SafetyClient;
