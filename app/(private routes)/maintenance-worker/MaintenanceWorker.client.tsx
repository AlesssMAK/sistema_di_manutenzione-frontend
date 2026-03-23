'use client';

import { usePageStore } from '@/lib/store/pageStore';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import css from './page.module.css';
import CalendarBlock from '@/components/CalendarBlock/CalendarBlock';
import FaultCardsList from '@/components/FaultCardsList/FaultCardsList';
import { FaultCard } from '@/types/faultType';
import { fetchFaultCards } from '@/lib/api/faults';

const MaintenanceWorkerClient = () => {
  const t = useTranslations('maintenanceWorkerPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);
  const [items, setItems] = useState<FaultCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));

    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchFaultCards({ page: 1, limit: 2 });
        setItems(data.items);
      } catch (error) {
        console.error('Errore durante il caricamento dei dati:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [setPageTitle, t]);

  return (
    <div>
      <h2 className={css.workerHeaderPage}>Pianificazione Manutentore</h2>
      <p className={css.workerTextPage}>
        Visualizza e gestisci gli interventi pianificati
      </p>
      <div className={css.workerContainer}>
        <CalendarBlock />
        <FaultCardsList faults={items} />
      </div>
    </div>
  );
};

export default MaintenanceWorkerClient;
