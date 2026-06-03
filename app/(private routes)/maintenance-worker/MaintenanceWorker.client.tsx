'use client';

import { usePageStore } from '@/lib/store/pageStore';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback, useRef } from 'react';
import css from './page.module.css';
import CalendarBlock from '@/components/CalendarBlock/CalendarBlock';
import FaultCardsList from '@/components/FaultCardsList/FaultCardsList';
import LoadMoreButton from '@/components/LoadMoreButton/LoadMoreButton';
import DateNow from '@/components/DateNow/DateNow';
import ScopeFilterBar, {
  type FaultScope,
} from '@/components/ScopeFilterBar/ScopeFilterBar';
import DaySlotGrid from '@/components/DaySlotGrid/DaySlotGrid';
import { FaultCard } from '@/types/faultType';
import { fetchFaultCards } from '@/lib/api/faults';
import { useAuthStore } from '@/lib/store/authStore';

type ViewMode = 'default' | 'overdue';

const PER_PAGE = 6;

const MaintenanceWorkerClient = () => {
  const t = useTranslations('maintenanceWorkerPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  const [items, setItems] = useState<FaultCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priority, setPriority] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [scope, setScope] = useState<FaultScope>('mine');
  const [overdueDeadlineDates, setOverdueDeadlineDates] = useState<string[]>(
    []
  );

  // race-guard: stale responses must not overwrite fresh state
  const requestIdRef = useRef(0);

  const isOverdueMode = viewMode === 'overdue';

  const loadData = useCallback(
    async (
      pageNum: number,
      currentPriority: string,
      currentDate: string,
      currentMode: ViewMode,
      currentScope: FaultScope,
      currentUserId: string
    ) => {
      const reqId = ++requestIdRef.current;

      // clear stale items immediately when starting a fresh (page 1) request
      // so the UI doesn't show old data while the new one is loading
      if (pageNum === 1) {
        setItems([]);
        setTotalPage(0);
      }
      setIsLoading(true);

      try {
        const scopeParams =
          currentScope === 'mine' && currentUserId
            ? { assignedTo: currentUserId }
            : currentScope === 'pool'
              ? { assignedToEmpty: true }
              : {};

        const data = await fetchFaultCards({
          page: pageNum,
          perPage: PER_PAGE,
          priority: currentPriority,
          ...(currentMode === 'overdue'
            ? { statusFault: 'Overdue' }
            : currentDate
              ? { plannedDate: currentDate }
              : {}),
          ...scopeParams,
        });

        // discard if a newer request has started in the meantime
        if (reqId !== requestIdRef.current) return;

        if (pageNum === 1) {
          setItems(data.fault || []);
        } else {
          setItems(prev => [...prev, ...(data.fault || [])]);
        }
        setTotalPage(data.totalPage || 0);
      } catch (error) {
        if (reqId !== requestIdRef.current) return;
        console.error('Errore durante il caricamento dei dati:', error);
      } finally {
        if (reqId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  const fetchOverdueDeadlines = useCallback(async (currentPriority: string) => {
    try {
      // TODO: replace with GET /faults/deadlines once backend endpoint lands
      const data = await fetchFaultCards({
        page: 1,
        perPage: 200,
        priority: currentPriority,
        statusFault: 'Overdue',
      });

      const dates = (data.fault || [])
        .filter(
          (item): item is FaultCard & { deadline: string } => !!item.deadline
        )
        .map(item =>
          item.deadline.includes('T')
            ? item.deadline.split('T')[0]
            : item.deadline
        );

      setOverdueDeadlineDates(dates);
    } catch (error) {
      console.error('Errore caricamento scadenze:', error);
    }
  }, []);

  const handlePriorityChange = (newPriority: string) => {
    const newValue = priority === newPriority ? '' : newPriority;
    setPriority(newValue);
    setPage(1);
    if (isOverdueMode) fetchOverdueDeadlines(newValue);
  };

  const handleDateChange = (date: string) => {
    const value = selectedDate === date ? '' : date;
    setSelectedDate(value);
    setPage(1);
  };

  const handleScopeChange = (newScope: FaultScope) => {
    if (newScope === scope) return;
    setScope(newScope);
    setPage(1);
  };

  const toggleOverdueMode = () => {
    const nextMode: ViewMode = isOverdueMode ? 'default' : 'overdue';
    setViewMode(nextMode);
    setSelectedDate('');
    setPage(1);
    if (nextMode === 'overdue') {
      fetchOverdueDeadlines(priority);
    } else {
      setOverdueDeadlineDates([]);
    }
  };

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
    loadData(1, priority, selectedDate, viewMode, scope, userId);
  }, [
    setPageTitle,
    t,
    loadData,
    priority,
    selectedDate,
    viewMode,
    scope,
    userId,
  ]);

  return (
    <div className="container">
      <div className={css.pageWrapper}>
        <h2 className="title">Pianificazione Manutentore</h2>
        <p className="subtitle">
          Visualizza e gestisci gli interventi pianificati
        </p>

        <div className={css.controls}>
          {!isOverdueMode && (
            <ScopeFilterBar
              activeScope={scope}
              onScopeChange={handleScopeChange}
            />
          )}
          <button
            onClick={toggleOverdueMode}
            className={`${css.deadlineButton} ${isOverdueMode ? css.active : ''}`}
          >
            {isOverdueMode ? 'Mostra tutte' : 'Mostra scadute'}
          </button>
        </div>

        <div className={css.workerContainer}>
          <CalendarBlock
            activePriority={priority}
            onPriorityChange={handlePriorityChange}
            activeDate={selectedDate}
            onDateChange={handleDateChange}
            deadlineDates={isOverdueMode ? overdueDeadlineDates : []}
            isDeadlineMode={isOverdueMode}
          />

          <div className={css.contentSection}>
            <div className={css.contextLabel}>
              <DateNow
                selectedDate={selectedDate}
                mode={isOverdueMode ? 'overdue' : 'default'}
                priority={priority}
              />
            </div>

            {isLoading && page === 1 ? (
              <p className={css.loadingText}>Caricamento...</p>
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
                      loadData(
                        nextPage,
                        priority,
                        selectedDate,
                        viewMode,
                        scope,
                        userId
                      );
                    }}
                  />
                </div>
              </>
            ) : (
              <div className={css.noResults}>
                <p className={css.noResultsText}>
                  {isOverdueMode
                    ? 'Nessuna segnalazione in ritardo'
                    : selectedDate
                      ? scope === 'mine'
                        ? 'Nessuna segnalazione assegnata a te in questa data'
                        : scope === 'pool'
                          ? 'Nessuna segnalazione libera in questa data'
                          : 'Nessuna segnalazione in questa data'
                      : scope === 'mine'
                        ? 'Nessuna segnalazione assegnata a te'
                        : scope === 'pool'
                          ? 'Nessuna segnalazione libera (pool vuoto)'
                          : 'Nessuna segnalazione'}
                </p>
                {!isOverdueMode && scope !== 'all' && (
                  <button
                    type="button"
                    className={css.emptyHintButton}
                    onClick={() => handleScopeChange('all')}
                  >
                    Mostra tutte
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {!isOverdueMode && selectedDate && (
          <DaySlotGrid selectedDate={selectedDate} faults={items} />
        )}
      </div>
    </div>
  );
};

export default MaintenanceWorkerClient;
