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
  const [priority, setPriority] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [showDeadlines, setShowDeadlines] = useState(false);
  const [allDeadlineDates, setAllDeadlineDates] = useState<string[]>([]);
  const PER_PAGE = 2;

  const loadData = useCallback(
    async (pageNum: number, currentPriority: string, currentDate: string) => {
      try {
        setIsLoading(true);

        const data = await fetchFaultCards({
          page: pageNum,
          perPage: PER_PAGE,
          priority: currentPriority,
          dataCreated: currentDate,
        });
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
    },
    []
  );
  const fetchAllDeadlines = useCallback(async (currentPriority: string) => {
    try {
      const data = await fetchFaultCards({
        page: 1,
        perPage: 45,
        priority: currentPriority,
      });

      const dates = data.fault
        .filter(
          (item): item is FaultCard & { deadline: string } => !!item.deadline
        )
        .map(item => {
          const datePart = item.deadline.includes('T')
            ? item.deadline.split('T')[0]
            : item.deadline;
          return datePart;
        });

      setAllDeadlineDates(dates);
    } catch (error) {
      console.error('Errore loading all deadlines:', error);
    }
  }, []);

  const handlePriorityChange = (newPriority: string) => {
    const newValue = priority === newPriority ? '' : newPriority;
    setPriority(newValue);
    setPage(1);
    if (showDeadlines) fetchAllDeadlines(newValue);
  };
  const handleDateChange = (date: string) => {
    const value = selectedDate === date ? '' : date;
    setSelectedDate(value);
    setPage(1);
  };
  const toggleDeadlineMode = () => {
    const nextMode = !showDeadlines;
    setShowDeadlines(nextMode);
    if (nextMode) {
      fetchAllDeadlines(priority);
    }
  };

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
    loadData(1, priority, selectedDate);
  }, [setPageTitle, t, loadData, priority, selectedDate]);

  return (
    <div className={css.pageWrapper}>
      <h2 className={css.workerHeaderPage}>Pianificazione Manutentore</h2>
      <p className={css.workerTextPage}>
        Visualizza e gestisci gli interventi pianificati
      </p>

      <div className={css.controls}>
        <button
          onClick={toggleDeadlineMode}
          className={`${css.deadlineButton} ${showDeadlines ? css.active : ''}`}
        >
          {showDeadlines ? 'Скрыть дедлайны' : 'Показать дедлайны'}
        </button>
      </div>

      <div className={css.workerContainer}>
        <CalendarBlock
          activePriority={priority}
          onPriorityChange={handlePriorityChange}
          activeDate={selectedDate}
          onDateChange={handleDateChange}
          deadlineDates={showDeadlines ? allDeadlineDates : []}
          isDeadlineMode={showDeadlines}
        />

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
                  onLoadMore={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    loadData(nextPage, priority, selectedDate);
                  }}
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
