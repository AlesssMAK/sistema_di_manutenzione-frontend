'use client';

import { usePageStore } from '@/lib/store/pageStore';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback, useRef } from 'react';
import css from './page.module.css';
import FaultCardsList from '@/components/FaultCardsList/FaultCardsList';
import LoadMoreButton from '@/components/LoadMoreButton/LoadMoreButton';
import ScopeFilterBar, {
  type FaultScope,
} from '@/components/MaintenanceWorker/ScopeFilterBar/ScopeFilterBar';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';

import DaySlotGrid from '@/components/MaintenanceWorker/DaySlotGrid/DaySlotGrid';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Button from '@/components/UI/Button/Button';
import { FaultCard } from '@/types/faultType';
import { fetchFaultCards, fetchFaultDeadlines } from '@/lib/api/faults';
import { fetchSystemSettings } from '@/lib/api/systemSettings';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import CalendarBlock from '@/components/MaintenanceWorker/CalendarBlock/CalendarBlock';
import { type PlannedDayBucket } from '@/components/MaintenanceWorker/Calendar/Calendar';
import DateNow from '@/components/MaintenanceWorker/DateNow/DateNow';

export type FaultViewMode = 'active' | 'overdue' | 'completed';

const ACTIVE_STATUSES = 'Created,In progress,Suspended,Overdue';
const PER_PAGE = 6;

const MaintenanceWorkerClient = () => {
  const t = useTranslations('maintenanceWorkerPage');
  const tNoFound = useTranslations('NoFound');
  const setPageTitle = usePageStore(state => state.setPageTitle);
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  const VIEW_MODE_TABS: TabItem<FaultViewMode>[] = [
    { value: 'active', label: t('tabs.active') },
    { value: 'overdue', label: t('tabs.overdue') },
    { value: 'completed', label: t('tabs.completed') },
  ];

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
  const [plannedDays, setPlannedDays] = useState<
    Record<string, PlannedDayBucket>
  >({});

  // race-guard: stale responses must not overwrite fresh state
  const requestIdRef = useRef(0);

  // SystemSettings is a tiny singleton document — fetch once and
  // reuse across the session. Cached for an hour because the
  // admin-side settings UI invalidates the cache on save anyway.
  const { data: settings } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: fetchSystemSettings,
    staleTime: 60 * 60 * 1000,
  });
  // Parse 'HH:mm' → hour bucket the slot grid renders. End hour is
  // inclusive in DaySlotGrid (renders the row), so we floor the
  // end-of-workday to the last hour that contains slot time. The
  // 8/17 fallback matches the previous hard-coded values.
  const parseHour = (hhmm: string | undefined, fallback: number) => {
    if (!hhmm) return fallback;
    const [h] = hhmm.split(':');
    const n = Number(h);
    return Number.isFinite(n) ? n : fallback;
  };
  const startHour = parseHour(settings?.workHours?.start, 8);
  const endHour = parseHour(settings?.workHours?.end, 17);

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
        console.error(t('errors.loadData'), error);
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
        setPlannedDays({});
        return;
      }
      try {
        const scopeParams =
          currentScope === 'mine' && currentUserId
            ? { assignedTo: currentUserId }
            : currentScope === 'pool'
              ? { assignedToEmpty: true }
              : {};

        // Per-day planned counts via the aggregated endpoint
        // (replaces the old perPage:200 trick). Window = current
        // month ± 1, which is what the calendar can show anyway.
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const to = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        const data = await fetchFaultDeadlines({
          field: 'plannedDate',
          dateFrom: from.toISOString().slice(0, 10),
          dateTo: to.toISOString().slice(0, 10),
          statusFault: ACTIVE_STATUSES,
          ...scopeParams,
        });

        const days: Record<string, PlannedDayBucket> = {};
        data.dates.forEach(bucket => {
          // High > Medium > Low precedence: a single High-priority
          // fault on a day is enough to tint the badge red.
          const highestPriority =
            bucket.byPriority.High > 0
              ? 'High'
              : bucket.byPriority.Medium > 0
                ? 'Medium'
                : bucket.byPriority.Low > 0
                  ? 'Low'
                  : null;
          days[bucket.date] = { count: bucket.count, highestPriority };
        });
        setPlannedDays(days);
      } catch (error) {
        console.error(t('errors.loadCounts'), error);
      }
    },
    [t]
  );

  const fetchOverdueDeadlines = useCallback(async (currentPriority: string) => {
    try {
      // Overdue heatmap via the aggregated endpoint. Wide window so
      // we catch deadlines that drifted past the visible month.
      const today = new Date();
      const from = new Date(today.getFullYear() - 1, 0, 1);
      const to = new Date(today.getFullYear() + 1, 11, 31);
      const data = await fetchFaultDeadlines({
        field: 'deadline',
        dateFrom: from.toISOString().slice(0, 10),
        dateTo: to.toISOString().slice(0, 10),
        statusFault: 'Overdue',
        ...(currentPriority ? { priority: currentPriority } : {}),
      });

      const dates = data.dates.map(bucket => bucket.date);

      setOverdueDeadlineDates(dates);
    } catch (error) {
      console.error(t('errors.loadDeadlines'), error);
    }
  }, [t]);

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
  let emptyText = t('empty.default');
  if (isOverdueMode) {
    emptyText = t('empty.overdue');
  } else if (isCompletedMode) {
    emptyText = selectedDate
      ? t('empty.completedDate')
      : t('empty.completed');
  } else if (selectedDate) {
    emptyText =
      scope === 'mine'
        ? t('empty.mineDate')
        : scope === 'pool'
          ? t('empty.poolDate')
          : t('empty.dateOnly');
  } else {
    emptyText =
      scope === 'mine'
        ? t('empty.mine')
        : scope === 'pool'
          ? t('empty.pool')
          : t('empty.default');
  }

  const showResetButton = !isOverdueMode && (selectedDate || scope !== 'all');

  return (
    <div className="container">
      <div className={css.pageWrapper}>
        <h2 className="title">{t('headerTitle')}</h2>
        <p className="subtitle">{t('headerSubtitle')}</p>

        <div className={css.workerContainer}>
          <CalendarBlock
            activePriority={priority}
            onPriorityChange={handlePriorityChange}
            activeDate={selectedDate}
            onDateChange={handleDateChange}
            deadlineDates={isOverdueMode ? overdueDeadlineDates : []}
            isDeadlineMode={isOverdueMode}
            plannedDays={plannedDays}
          />

          <div className={css.contentSection}>
            {/* Tabs sit inside contentSection so on phone/tablet they
                land below the calendar (stacked column layout) and
                on desktop they head the fault column next to the
                calendar sidebar. */}
            <div className={css.tabsBarWrap}>
              <Tabs<FaultViewMode>
                tabs={VIEW_MODE_TABS}
                activeTab={viewMode}
                onTabChange={handleModeChange}
              />
            </div>

            <div className={css.contextRow}>
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
              <ScopeFilterBar
                activeScope={scope}
                onScopeChange={handleScopeChange}
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
                    {t('empty.resetButton')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {!isOverdueMode && selectedDate && (
          <DaySlotGrid
            selectedDate={selectedDate}
            faults={items}
            startHour={startHour}
            endHour={endHour}
          />
        )}
      </div>
    </div>
  );
};

export default MaintenanceWorkerClient;
