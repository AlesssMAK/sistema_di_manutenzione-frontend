'use client';

import { usePageStore } from '@/lib/store/pageStore';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback } from 'react';
import css from './page.module.css';
import CalendarBlock from '@/components/CalendarBlock/CalendarBlock';
import FaultCardsList from '@/components/FaultCardsList/FaultCardsList';
import LoadMoreButton from '@/components/LoadMoreButton/LoadMoreButton';
import { FaultCard } from '@/types/faultType';
import { fetchFaultCards } from '@/lib/api/faults';

const MaintenanceWorkerClient = () => {
  const t = useTranslations('maintenanceWorkerPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  const [items, setItems] = useState<FaultCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);

  const PER_PAGE = 1;

  const loadData = useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);

      const data = await fetchFaultCards({ page: pageNum, perPage: PER_PAGE });
      console.log('Data from server:', data);
      if (pageNum === 1) {
        setItems(data.fault || []);
      } else {
        setItems(prev => [...prev, ...(data.fault || [])]);
      }

      setTotalPage(data.totalPage || 0);
    } catch (error) {
      console.error('Errore во время загрузки данных:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
    loadData(1);
  }, [setPageTitle, t, loadData]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage);
  };

  return (
    <div className={css.pageWrapper}>
      <h2 className={css.workerHeaderPage}>Pianificazione Manutentore</h2>
      <p className={css.workerTextPage}>
        Visualizza e gestisci gli interventi pianificati
      </p>

      <div className={css.workerContainer}>
        <CalendarBlock />

        <div className={css.contentSection}>
          {isLoading && page === 1 ? (
            <p className={css.loadingText}>Загрузка данных...</p>
          ) : items.length > 0 ? (
            <>
              <FaultCardsList faults={items} />

              <div className={css.loadMoreButton}>
                <LoadMoreButton
                  page={page}
                  totalPage={totalPage}
                  isLoading={isLoading}
                  onLoadMore={handleLoadMore}
                />
              </div>
            </>
          ) : (
            <div className={css.noResults}>
              <p className={css.noResultsText}>No faults in this day</p>
              <p className={css.noResultsSubtext}>
                Try adjusting your search criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceWorkerClient;
