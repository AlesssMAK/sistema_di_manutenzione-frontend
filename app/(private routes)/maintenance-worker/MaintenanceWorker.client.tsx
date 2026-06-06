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
import ViewModeBar, {
  type FaultViewMode,
} from '@/components/ViewModeBar/ViewModeBar';
import DaySlotGrid from '@/components/DaySlotGrid/DaySlotGrid';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Button from '@/components/UI/Button/Button';
import { FaultCard } from '@/types/faultType';
import { fetchFaultCards } from '@/lib/api/faults';
import { useAuthStore } from '@/lib/store/authStore';

const ACTIVE_STATUSES = 'Created,In progress,Suspended,Overdue';
const PER_PAGE = 6;

const MaintenanceWorkerClient = () => {
  const t = useTranslations('maintenanceWorkerPage');
  const tNoFound = useTranslations('NoFound');
  const setPageTitle = usePageStore(state => state.setPageTitle);
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  const [items, setItems] = useState<FaultCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priority, setPriority] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [viewMode, setViewMode] = useState<FaultViewMode>('active');
  const [scope, setScope] = useState<FaultScope>('mine');
  const [overdueDeadlineDates, setOverdueDeadlineDates] = useState<string[]>(
    []
  );
  const [plannedCounts, setPlannedCounts] = useState<Record<string, number>>(
    {}
  );

  // race-guard: stale responses must not overwrite fresh state
  const requestIdRef = useRef(0);

  const isOverdueMode = viewMode === 'overdue';
  const isCompletedMode = viewMode === 'completed';

  const loadData = useCallback(
    async (
      pageNum: number,
      currentPriority: string,
      currentDate: string,
      currentMode: FaultViewMode,
      currentScope: FaultScope,
      currentUserId: string
    ) => {
      const reqId = ++requestIdRef.current;

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

        const statusFault =
          currentMode === 'overdue'
            ? 'Overdue'
            : currentMode === 'completed'
              ? 'Completed'
              : ACTIVE_STATUSES;

        const data = await fetchFaultCards({
          page: pageNum,
          perPage: PER_PAGE,
          priority: currentPriority,
          statusFault,
          // Date filter applied in active/completed modes only — overdue
          // shows everything in ritardo regardless of plannedDate.
          ...(currentMode !== 'overdue' && currentDate
            ? { plannedDate: currentDate }
            : {}),
          ...scopeParams,
        });

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

  const fetchPlannedCounts = useCallback(
    async (
      currentScope: FaultScope,
      currentUserId: string,
      currentMode: FaultViewMode
    ) => {
      // Badges are only meaningful for active work — overdue uses the red
      // deadlineCell highlighting; completed is just historical browsing.
      if (currentMode !== 'active') {
        setPlannedCounts({});
        return;
      }
      try {
        const scopeParams =
          currentScope === 'mine' && currentUserId
            ? { assignedTo: currentUserId }
            : currentScope === 'pool'
              ? { assignedToEmpty: true }
              : {};

        // TODO: replace with GET /faults/deadlines once backend endpoint lands
        const data = await fetchFaultCards({
          page: 1,
          perPage: 200,
          statusFault: ACTIVE_STATUSES,
          ...scopeParams,
        });

        const counts: Record<string, number> = {};
        (data.fault || []).forEach(f => {
          if (f.plannedDate) {
            counts[f.plannedDate] = (counts[f.plannedDate] ?? 0) + 1;
          }
        });
        setPlannedCounts(counts);
      } catch (error) {
        console.error('Errore caricamento conteggi calendario:', error);
      }
    },
    []
  );

  const fetchOverdueDeadlines = useCallback(async (currentPriority: string) => {
    try {
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
    if (!date) return;
    if (date === selectedDate) return;
    setSelectedDate(date);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedDate('');
    setScope('all');
    setPage(1);
  };

  const handleScopeChange = (newScope: FaultScope) => {
    if (newScope === scope) return;
    setScope(newScope);
    setPage(1);
  };

  const handleModeChange = (newMode: FaultViewMode) => {
    if (newMode === viewMode) return;
    setViewMode(newMode);
    setSelectedDate('');
    setPage(1);

    if (newMode === 'overdue') {
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

  useEffect(() => {
    fetchPlannedCounts(scope, userId, viewMode);
  }, [scope, userId, viewMode, fetchPlannedCounts]);

  // ---------- empty-state copy -----------------------------------------
  let emptyText = 'Nessuna segnalazione';
  if (isOverdueMode) {
    emptyText = 'Nessuna segnalazione in ritardo';
  } else if (isCompletedMode) {
    emptyText = selectedDate
      ? 'Nessuna segnalazione completata in questa data'
      : 'Nessuna segnalazione completata';
  } else if (selectedDate) {
    emptyText =
      scope === 'mine'
        ? 'Nessuna segnalazione assegnata a te in questa data'
        : scope === 'pool'
          ? 'Nessuna segnalazione libera in questa data'
          : 'Nessuna segnalazione in questa data';
  } else {
    emptyText =
      scope === 'mine'
        ? 'Nessuna segnalazione assegnata a te'
        : scope === 'pool'
          ? 'Nessuna segnalazione libera (pool vuoto)'
          : 'Nessuna segnalazione';
  }

  const showResetButton =
    !isOverdueMode && (selectedDate || scope !== 'all');

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
          <ViewModeBar
            activeMode={viewMode}
            onModeChange={handleModeChange}
          />
        </div>

        <div className={css.workerContainer}>
          <CalendarBlock
            activePriority={priority}
            onPriorityChange={handlePriorityChange}
            activeDate={selectedDate}
            onDateChange={handleDateChange}
            deadlineDates={isOverdueMode ? overdueDeadlineDates : []}
            isDeadlineMode={isOverdueMode}
            plannedCounts={plannedCounts}
          />

          <div className={css.contentSection}>
            <div className={css.contextLabel}>
              <DateNow
                selectedDate={selectedDate}
                mode={
                  isOverdueMode
                    ? 'overdue'
                    : isCompletedMode
                      ? 'completed'
                      : 'default'
                }
                priority={priority}
              />
            </div>

            {isLoading && page === 1 ? (
              <div className={css.loadingWrap}>
                <Loader />
              </div>
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
                <NoFound
                  title={tNoFound('noResultsTitle')}
                  message={emptyText}
                />
                {showResetButton && (
                  <Button
                    type="button"
                    className="button button--blue"
                    onClick={handleResetFilters}
                  >
                    Mostra tutte
                  </Button>
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
