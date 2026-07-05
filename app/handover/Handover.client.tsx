'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { usePageStore } from '@/lib/store/pageStore';
import { getAllPlants } from '@/lib/api/plants';
import BachecaColumn from '@/components/Bacheca/BachecaColumn/BachecaColumn';
import css from '../Bacheca.module.css';

const HandoverClient = () => {
  const t = useTranslations('BachecaPage');
  const { user } = useAuthStore();
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('sections.handover.title'));
  }, [setPageTitle, t]);

  const canCreate =
    user?.role === 'admin' ||
    user?.permissions?.canCreateAnnouncements === true;

  // Machines for the handover picker (active only). Only fetched when
  // the user can create — readers don't need it.
  const { data: plantsData, isLoading: plantsLoading } = useQuery({
    queryKey: ['plants', 'active'],
    queryFn: () => getAllPlants({ perPage: 200 }),
    placeholderData: keepPreviousData,
    enabled: canCreate,
  });

  const { plantLabels, labelToId } = useMemo(() => {
    const active = (plantsData?.plants ?? []).filter(
      p => p.status === 'active'
    );
    const labels: string[] = [];
    const map = new Map<string, string>();
    for (const p of active) {
      const label = `${p.namePlant} - ${p.code}`;
      labels.push(label);
      map.set(label, p._id);
    }
    return { plantLabels: labels, labelToId: map };
  }, [plantsData]);

  return (
    <main className={css.main}>
      <div className="container">
        <BachecaColumn
          category="handover"
          canCreate={canCreate}
          withMachine
          plantLabels={plantLabels}
          resolvePlantId={label => labelToId.get(label) ?? ''}
          plantsLoading={plantsLoading}
        />
      </div>
    </main>
  );
};

export default HandoverClient;
