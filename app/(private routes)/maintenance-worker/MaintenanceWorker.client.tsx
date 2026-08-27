'use client';

import FaultCardsList from '@/components/FaultCardsList/FaultCardsList';
import LoadMoreButton from '@/components/LoadMoreButton/LoadMoreButton';
import ScopeFilterBar, {
  type FaultScope,
} from '@/components/MaintenanceWorker/ScopeFilterBar/ScopeFilterBar';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import css from './page.module.css';

import { type PlannedDayBucket } from '@/components/MaintenanceWorker/Calendar/Calendar';
import CalendarBlock from '@/components/MaintenanceWorker/CalendarBlock/CalendarBlock';
import DateNow from '@/components/MaintenanceWorker/DateNow/DateNow';
import DaySlotGrid from '@/components/MaintenanceWorker/DaySlotGrid/DaySlotGrid';
import Button from '@/components/UI/Button/Button';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import {
  fetchFaultCards,
  fetchFaultDeadlines,
  fetchMaintenanceTabCounts,
  markMaintenanceTabSeen,
  type MaintenanceSeenTab,
} from '@/lib/api/faults';
import { fetchSystemSettings } from '@/lib/api/systemSettings';
import { hhmmToMinutes, resolveWorkWindow } from '@/lib/utils/workSchedule';
import { useAuthStore } from '@/lib/store/authStore';
import { useSocket } from '@/providers/SocketProvider/SocketProvider';
import { FaultCard } from '@/types/faultType';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type FaultViewMode = 'active' | 'overdue' | 'completed';

const ACTIVE_STATUSES = 'Created,In progress,Suspended,Overdue';
const PER_PAGE = 6;

const MaintenanceWorkerClient = () => {
  const t = useTranslations('maintenanceWorkerPage');
  const tNoFound = useTranslations('NoFound');
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  const VIEW_MODE_TABS: TabItem<FaultViewMode>[] = [
    { value: 'active', label: t('tabs.active'), icon: 'wrench' },
    { value: 'overdue', label: t('tabs.overdue'), icon: 'clock' },
    { value: 'completed', label: t('tabs.completed'), icon: 'check-circle' },
  ];

  const [items, setItems] = useState<FaultCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priority, setPriority] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [viewMode, setViewMode] = useState<FaultViewMode>('active');
  const [scope, setScope] = useState<FaultScope>('mine');
  // The landing scope is picked from data on first load: 'mine' when
  // the worker has any active assigned fault, otherwise 'pool' (free
  // faults). Once resolved (or on manual change) the auto-select stops.
  const [scopeResolved, setScopeResolved] = useState(false);
  // Live count of faults created (via socket) since the current list
  // was last loaded — surfaced as a "N new" refresh pill.
  const [newFaultCount, setNewFaultCount] = useState(0);
  const { socket } = useSocket();
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

  const queryClient = useQueryClient();

  // Unseen-count badges for the board tabs (persisted per user).
  const { data: tabCounts } = useQuery({
    queryKey: ['maintenanceTabCounts'],
    queryFn: fetchMaintenanceTabCounts,
    staleTime: 30 * 1000,
  });

  const markSeen = useCallback(
    (tab: MaintenanceSeenTab) => {
      markMaintenanceTabSeen(tab)
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ['maintenanceTabCounts'] })
        )
        .catch(() => {});
    },
    [queryClient]
  );
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
  // The slot grid spans the worker's own working window (per-user →
  // role → factory), floored/ceiled to whole hours for the hourly rows.
  const workerWindow = resolveWorkWindow(
    settings,
    { userId, role: user?.role },
    selectedDate || undefined
  );
  const startHour = Math.floor(
    (hhmmToMinutes(workerWindow.start) ?? parseHour(settings?.workHours?.start, 8) * 60) / 60
  );
  const endHour = Math.ceil(
    (hhmmToMinutes(workerWindow.end) ?? parseHour(settings?.workHours?.end, 17) * 60) / 60
  );

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
        const statusFault =
          currentMode === 'overdue'
            ? 'Overdue'
            : currentMode === 'completed'
              ? 'Completed'
              : ACTIVE_STATUSES;

        const baseParams = {
          priority: currentPriority,
          statusFault,
          // Date filter applied in active/completed modes only — overdue
          // shows everything in ritardo regardless of plannedDate.
          ...(currentMode !== 'overdue' && currentDate
            ? { plannedDate: currentDate }
            : {}),
        };

        const scopeParams =
          currentScope === 'mine' && currentUserId
            ? { assignedTo: currentUserId }
            : currentScope === 'pool'
              ? { assignedToEmpty: true }
              : {};

        const data = await fetchFaultCards({
          ...baseParams,
          page: pageNum,
          perPage: PER_PAGE,
          // Completed history is ordered by closing time, most recent
          // first. Otherwise: my assigned interventions oldest-first
          // (creation order); pool/all keep the default newest-first.
          ...(currentMode === 'completed'
            ? { sortBy: 'completedAt' as const, sortOrder: 'desc' as const }
            : currentScope === 'mine'
              ? { sort: 'asc' as const }
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
    [t]
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

  const fetchOverdueDeadlines = useCallback(
    async (currentPriority: string) => {
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
    },
    [t]
  );

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
    // Viewing the pool clears its unseen badge.
    if (newScope === 'pool') markSeen('pool');
  };

  const handleModeChange = (newMode: FaultViewMode) => {
    if (newMode === viewMode) return;
    setViewMode(newMode);
    setSelectedDate('');
    setPage(1);
    // 'Libere' (pool) is meaningless in the completed history — completed
    // faults are always assigned. Drop back to 'Mie' when entering it.
    if (newMode === 'completed' && scope === 'pool') setScope('mine');
    // Viewing a tab clears its unseen badge.
    markSeen(newMode);

    if (newMode === 'overdue') {
      fetchOverdueDeadlines(priority);
    } else {
      setOverdueDeadlineDates([]);
    }
  };

  // One-shot landing-scope auto-select: 'mine' if the worker has any
  // active assigned fault, otherwise 'pool'. Runs once the userId is
  // known; the main load below waits for it so there's no flash.
  useEffect(() => {
    if (!userId || scopeResolved) return;
    let cancelled = false;
    (async () => {
      try {
        const mine = await fetchFaultCards({
          page: 1,
          perPage: 1,
          statusFault: ACTIVE_STATUSES,
          assignedTo: userId,
        });
        if (cancelled) return;
        setScope((mine.totalFault ?? 0) > 0 ? 'mine' : 'pool');
      } catch {
        if (!cancelled) setScope('mine');
      } finally {
        if (!cancelled) setScopeResolved(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, scopeResolved]);

  useEffect(() => {
    if (!scopeResolved) return;
    // A fresh load reflects current state, so the "new since load"
    // counter starts over.
    setNewFaultCount(0);
    loadData(1, priority, selectedDate, viewMode, scope, userId);
  }, [
    scopeResolved,
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

  // Mark the landing tab (and pool if landing there) seen once resolved,
  // so its badge starts cleared — like opening a message inbox.
  useEffect(() => {
    if (!scopeResolved) return;
    markSeen(viewMode);
    if (scope === 'pool') markSeen('pool');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeResolved]);

  // Live "new fault" signal — the SocketProvider already broadcasts
  // fault:created globally (toast + query invalidation); here we also
  // count them so the worker gets an explicit, page-level refresh cue
  // (the list is manually fetched, so it doesn't auto-refresh).
  useEffect(() => {
    if (!socket) return;
    const invalidateCounts = () =>
      queryClient.invalidateQueries({ queryKey: ['maintenanceTabCounts'] });
    const onCreated = () => {
      setNewFaultCount(c => c + 1);
      invalidateCounts();
    };
    socket.on('fault:created', onCreated);
    socket.on('fault:updated', invalidateCounts);
    socket.on('fault:statusChanged', invalidateCounts);
    return () => {
      socket.off('fault:created', onCreated);
      socket.off('fault:updated', invalidateCounts);
      socket.off('fault:statusChanged', invalidateCounts);
    };
  }, [socket, queryClient]);

  const handleRefreshNew = () => {
    setNewFaultCount(0);
    setPage(1);
    loadData(1, priority, selectedDate, viewMode, scope, userId);
  };

  // After a claim the backend returns the updated fault (now In progress
  // and assigned to the worker). Replace it in place so the card reflects
  // the new state and the "take over" button drops out immediately —
  // without this the list only refreshed on a full page reload.
  const handleClaimed = (updated: FaultCard) => {
    setItems(prev => prev.map(f => (f._id === updated._id ? updated : f)));
  };

  // ---------- empty-state copy -----------------------------------------
  let emptyText = t('empty.default');
  if (isOverdueMode) {
    emptyText = t('empty.overdue');
  } else if (isCompletedMode) {
    emptyText = selectedDate ? t('empty.completedDate') : t('empty.completed');
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

  // Only non-zero counts become badges.
  const viewCounts: Partial<Record<FaultViewMode, number>> = {};
  if (tabCounts?.active) viewCounts.active = tabCounts.active;
  if (tabCounts?.overdue) viewCounts.overdue = tabCounts.overdue;
  if (tabCounts?.completed) viewCounts.completed = tabCounts.completed;
  const scopeCounts: Partial<Record<FaultScope, number>> = tabCounts?.pool
    ? { pool: tabCounts.pool }
    : {};

  return (
    <div className="container">
      <div className={css.page_wrapper}>
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
                counts={viewCounts}
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
                counts={scopeCounts}
                scopes={isCompletedMode ? ['mine', 'all'] : undefined}
              />
            </div>

            {newFaultCount > 0 && (
              <button
                type="button"
                className={css.newFaultsPill}
                onClick={handleRefreshNew}
                aria-label={t('newFaults.ariaLabel')}
              >
                <span className={css.newFaultsDot} aria-hidden="true" />
                <span>{t('newFaults.label', { count: newFaultCount })}</span>
                <span className={css.newFaultsAction}>
                  {t('newFaults.action')}
                </span>
              </button>
            )}

            {isLoading && page === 1 ? (
              <div className={css.loadingWrap}>
                <Loader />
              </div>
            ) : items.length > 0 ? (
              <>
                <FaultCardsList faults={items} onClaimed={handleClaimed} />

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
                <div className={css.no_found_container}>
                  <NoFound title={tNoFound('emptyTitle')} message={emptyText} />
                </div>
                {showResetButton && (
                  <div className={css.no_found_btn}>
                    <Button
                      type="button"
                      className="button button--blue"
                      onClick={handleResetFilters}
                      width={153}
                    >
                      {t('empty.resetButton')}
                    </Button>
                  </div>
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
