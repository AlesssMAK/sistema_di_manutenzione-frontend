'use client';

import FaultCardsList from '@/components/FaultCardsList/FaultCardsList';
import Pagination from '@/components/UI/Pagination/Pagination';
import ScopeFilterBar, {
  type FaultScope,
} from '@/components/MaintenanceWorker/ScopeFilterBar/ScopeFilterBar';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import { createOptionMapper } from '@/lib/utils/translationMapper';
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
  fetchListSeen,
  markListSeen,
  type ListSeenKey,
} from '@/lib/api/faults';
import { fetchSystemSettings } from '@/lib/api/systemSettings';
import { hhmmToMinutes, resolveWorkWindow } from '@/lib/utils/workSchedule';
import { useAuthStore } from '@/lib/store/authStore';
import { useAutoTabSwitchOnFilter } from '@/lib/hooks/useAutoTabSwitchOnFilter';
import { useSocket } from '@/providers/SocketProvider/SocketProvider';
import { FaultCard } from '@/types/faultType';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

export type FaultViewMode =
  | 'active'
  | 'inProgress'
  | 'suspended'
  | 'overdue'
  | 'completed';

// Landing-scope probe + pool query still use the narrow "there is active
// assigned work" set (no Suspended).
const ACTIVE_STATUSES = 'Created,In progress,Overdue';
// "Attive" is now the umbrella tab: everything that isn't closed.
const ALL_OPEN_STATUSES = 'Created,In progress,Overdue,Suspended';

// Which Fault date column the calendar badges + day-click filter use.
type CalendarField = 'plannedDate' | 'deadline' | 'completedAt';

// Per-tab config: the statuses it shows (calendar badges + list) and the
// date column those are bucketed / filtered by. This is what decouples the
// calendar from a single hard-coded "active" mode — every tab drives its
// own badges and day filter, narrowed only by the scope bar.
const MODE_CONFIG: Record<
  FaultViewMode,
  { statuses: string; field: CalendarField }
> = {
  active: { statuses: ALL_OPEN_STATUSES, field: 'plannedDate' },
  inProgress: { statuses: 'In progress', field: 'plannedDate' },
  suspended: { statuses: 'Suspended', field: 'plannedDate' },
  overdue: { statuses: 'Overdue', field: 'deadline' },
  completed: { statuses: 'Completed', field: 'completedAt' },
};

// Date-sort presets. 'auto' keeps the per-tab default (completed → most
// recently closed; mine → oldest first; else newest). The rest override.
type SortKey = 'auto' | 'recent' | 'oldest' | 'deadlineNear' | 'deadlineFar';
const SORT_CONFIG: Record<
  Exclude<SortKey, 'auto'>,
  { sort?: 'asc' | 'desc'; sortBy?: string; sortOrder?: 'asc' | 'desc' }
> = {
  recent: { sort: 'desc' },
  oldest: { sort: 'asc' },
  deadlineNear: { sortBy: 'deadline', sortOrder: 'asc' },
  deadlineFar: { sortBy: 'deadline', sortOrder: 'desc' },
};

const PER_PAGE = 3;

const MaintenanceWorkerClient = () => {
  const t = useTranslations('maintenanceWorkerPage');
  const tNoFound = useTranslations('NoFound');
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  const sortMapper = useMemo(
    () =>
      createOptionMapper<SortKey>([
        { value: 'auto', label: t('filters.sort.auto') },
        { value: 'recent', label: t('filters.sort.recent') },
        { value: 'oldest', label: t('filters.sort.oldest') },
        { value: 'deadlineNear', label: t('filters.sort.deadlineNear') },
        { value: 'deadlineFar', label: t('filters.sort.deadlineFar') },
      ]),
    [t]
  );

  const VIEW_MODE_TABS: TabItem<FaultViewMode>[] = [
    { value: 'active', label: t('tabs.active'), icon: 'wrench' },
    { value: 'inProgress', label: t('tabs.inProgress'), icon: 'reload' },
    { value: 'suspended', label: t('tabs.suspended'), icon: 'exclamation-circle' },
    { value: 'overdue', label: t('tabs.overdue'), icon: 'clock' },
    { value: 'completed', label: t('tabs.completed'), icon: 'check-circle' },
  ];

  const [items, setItems] = useState<FaultCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priority, setPriority] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  // Filtri panel (under the calendar): free-text search + planned-date
  // range. The range wins over the calendar's single-day selection.
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOption, setSortOption] = useState<SortKey>('auto');
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
  // Per-day calendar badges for the current tab (buckets keyed by the tab's
  // date column: plannedDate / deadline / completedAt).
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

  // Per-list lastSeen timestamps (drive model A for faults assigned to
  // others). Kept in a ref so loadData can read the latest without being
  // a hook dep (which would reload the list on every mark-seen).
  const { data: listSeen } = useQuery({
    queryKey: ['listSeen'],
    queryFn: fetchListSeen,
    staleTime: 30 * 1000,
  });
  const listSeenRef = useRef<Partial<Record<ListSeenKey, string>>>({});
  listSeenRef.current = listSeen ?? {};

  const seenKeyForMode = (m: FaultViewMode): ListSeenKey =>
    `worker_${m}` as ListSeenKey;

  // Board-state per view-mode tab: total (current scope) + a "has unseen"
  // flag. Mirrors the list's scope so the tab number matches what's shown.
  const scopeParamsFor = useCallback(
    (s: FaultScope) =>
      s === 'mine' && userId
        ? { assignedTo: userId }
        : s === 'pool'
          ? { assignedToEmpty: true }
          : {},
    [userId]
  );
  const statusForMode = (m: FaultViewMode) => MODE_CONFIG[m].statuses;

  // The Filtri narrowers that the tab counters mirror, so a badge equals the
  // filtered list total (priority + search + the "Periodo" any-date range).
  // The calendar day-selection is a per-tab drill-down, not part of this.
  const countFilters = {
    ...(priority ? { priority } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(dateFrom ? { anyDateFrom: dateFrom } : {}),
    ...(dateTo ? { anyDateTo: dateTo } : {}),
  };
  const countFilterKey = `${priority}|${debouncedSearch}|${dateFrom}|${dateTo}`;

  const BOARD_MODES: FaultViewMode[] = [
    'active',
    'inProgress',
    'suspended',
    'overdue',
    'completed',
  ];
  const boardResults = useQueries({
    queries: BOARD_MODES.map(m => {
      // Completed history has no pool; fall back to 'mine' so the count
      // matches the list (handleModeChange does the same on entry).
      const effScope: FaultScope =
        m === 'completed' && scope === 'pool' ? 'mine' : scope;
      const key = seenKeyForMode(m);
      const since = listSeen?.[key];
      return {
        queryKey: [
          'workerBoard',
          m,
          effScope,
          userId,
          since ?? null,
          countFilterKey,
        ],
        queryFn: () =>
          fetchFaultCards({
            page: 1,
            perPage: 1,
            statusFault: statusForMode(m),
            ...scopeParamsFor(effScope),
            ...countFilters,
            withUnseen: true,
            ...(since ? { seenSince: since } : {}),
          }),
        enabled: scopeResolved,
        staleTime: 15 * 1000,
      };
    }),
  });

  const markSeen = useCallback(
    (key: ListSeenKey) => {
      markListSeen(key)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['listSeen'] });
          queryClient.invalidateQueries({ queryKey: ['workerBoard'] });
        })
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
  const isSuspendedMode = viewMode === 'suspended';

  const loadData = useCallback(
    async (
      pageNum: number,
      currentPriority: string,
      currentDate: string,
      currentMode: FaultViewMode,
      currentScope: FaultScope,
      currentUserId: string,
      filters: {
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        sort?: SortKey;
      } = {}
    ) => {
      const reqId = ++requestIdRef.current;

      if (pageNum === 1) {
        setItems([]);
        setTotalPage(0);
      }
      setIsLoading(true);

      try {
        // Each tab is a fixed status set (no per-status narrower).
        const statusFault = MODE_CONFIG[currentMode].statuses;

        // Two independent date filters:
        //  • the Filtri "Periodo" range → any-date match (a fault shows if
        //    ANY of its dates is in the range), and it wins over…
        //  • the calendar's single selected day → a one-day window on the
        //    tab's own column (plannedDate / deadline / completedAt). The
        //    calendar stays per-tab; only the Periodo is any-date.
        const field = MODE_CONFIG[currentMode].field;
        const hasRange = Boolean(filters.dateFrom || filters.dateTo);
        const dayKeys: Record<CalendarField, [string, string]> = {
          plannedDate: ['plannedDateFrom', 'plannedDateTo'],
          deadline: ['deadlineFrom', 'deadlineTo'],
          completedAt: ['completedFrom', 'completedTo'],
        };
        const [fromKey, toKey] = dayKeys[field];
        let dateParams: Record<string, string> = {};
        if (hasRange) {
          dateParams = {
            ...(filters.dateFrom ? { anyDateFrom: filters.dateFrom } : {}),
            ...(filters.dateTo ? { anyDateTo: filters.dateTo } : {}),
          };
        } else if (currentDate) {
          dateParams =
            field === 'plannedDate'
              ? { plannedDate: currentDate }
              : { [fromKey]: currentDate, [toKey]: currentDate };
        }

        const baseParams = {
          priority: currentPriority,
          statusFault,
          ...(filters.search ? { search: filters.search } : {}),
          ...dateParams,
        };

        const scopeParams =
          currentScope === 'mine' && currentUserId
            ? { assignedTo: currentUserId }
            : currentScope === 'pool'
              ? { assignedToEmpty: true }
              : {};

        // An explicit date sort wins; 'auto' keeps the per-tab default:
        // completed → most recently closed, mine → oldest first (creation
        // order), pool/all → newest first.
        const sortParams =
          filters.sort && filters.sort !== 'auto'
            ? SORT_CONFIG[filters.sort]
            : currentMode === 'completed'
              ? { sortBy: 'completedAt' as const, sortOrder: 'desc' as const }
              : currentScope === 'mine'
                ? { sort: 'asc' as const }
                : {};

        const data = await fetchFaultCards({
          ...baseParams,
          page: pageNum,
          perPage: PER_PAGE,
          ...sortParams,
          ...scopeParams,
          // Per-card unseen dots. seenSince (this tab's lastSeen) drives
          // model A for faults assigned to others; read from the ref so a
          // mark-seen doesn't force a list reload.
          withUnseen: true,
          ...(listSeenRef.current[seenKeyForMode(currentMode)]
            ? { seenSince: listSeenRef.current[seenKeyForMode(currentMode)] }
            : {}),
        });

        if (reqId !== requestIdRef.current) return;

        // Paginated (not infinite-scroll): each page replaces the list.
        setItems(data.fault || []);
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

  const fetchCalendarCounts = useCallback(
    async (
      currentScope: FaultScope,
      currentUserId: string,
      currentMode: FaultViewMode
    ) => {
      try {
        // Completed history has no pool — fall back to 'mine' so the badges
        // match the list (mirrors the board + handleModeChange).
        const effScope: FaultScope =
          currentMode === 'completed' && currentScope === 'pool'
            ? 'mine'
            : currentScope;
        const scopeParams =
          effScope === 'mine' && currentUserId
            ? { assignedTo: currentUserId }
            : effScope === 'pool'
              ? { assignedToEmpty: true }
              : {};

        // Per-day counts for the current tab via the aggregated endpoint,
        // bucketed by that tab's date column. Window = current month ± 1,
        // which is what the calendar can show anyway.
        const { field, statuses } = MODE_CONFIG[currentMode];
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const to = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        const data = await fetchFaultDeadlines({
          field,
          dateFrom: from.toISOString().slice(0, 10),
          dateTo: to.toISOString().slice(0, 10),
          statusFault: statuses,
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

  const handlePriorityChange = (newPriority: string) => {
    const newValue = priority === newPriority ? '' : newPriority;
    setPriority(newValue);
    setPage(1);
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
    // 'Libere' (pool) is meaningless in the completed history — completed
    // faults are always assigned. Drop back to 'Mie' when entering it.
    if (newMode === 'completed' && scope === 'pool') setScope('mine');
    // Opening a tab clears its others-assigned (model A) cards; mine/pool
    // (model B) cards stay flagged until opened individually.
    markSeen(seenKeyForMode(newMode));
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
    loadData(1, priority, selectedDate, viewMode, scope, userId, {
      search: debouncedSearch,
      dateFrom,
      dateTo,
      sort: sortOption,
    });
  }, [
    scopeResolved,
    t,
    loadData,
    priority,
    selectedDate,
    viewMode,
    scope,
    userId,
    debouncedSearch,
    sortOption,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    fetchCalendarCounts(scope, userId, viewMode);
  }, [scope, userId, viewMode, fetchCalendarCounts]);

  // Mark the landing tab seen once resolved, so its others-assigned
  // (model A) cards start cleared. Mine/pool (model B) cards keep their
  // dots until opened individually.
  useEffect(() => {
    if (!scopeResolved) return;
    markSeen(seenKeyForMode(viewMode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeResolved]);

  // Live "new fault" signal — the SocketProvider already broadcasts
  // fault:created globally (toast + query invalidation); here we also
  // count them so the worker gets an explicit, page-level refresh cue
  // (the list is manually fetched, so it doesn't auto-refresh).
  useEffect(() => {
    if (!socket) return;
    const invalidateCounts = () => {
      queryClient.invalidateQueries({ queryKey: ['workerBoard'] });
    };
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
    loadData(1, priority, selectedDate, viewMode, scope, userId, {
      search: debouncedSearch,
      dateFrom,
      dateTo,
      sort: sortOption,
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === page) return;
    setPage(newPage);
    loadData(newPage, priority, selectedDate, viewMode, scope, userId, {
      search: debouncedSearch,
      dateFrom,
      dateTo,
      sort: sortOption,
    });
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
  } else if (isSuspendedMode) {
    emptyText = t('empty.suspended');
  } else if (isCompletedMode) {
    emptyText = selectedDate ? t('empty.completedDate') : t('empty.completed');
  } else if (viewMode === 'inProgress') {
    emptyText = t('empty.inProgress');
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

  const showResetButton = Boolean(selectedDate) || scope !== 'all';

  // Tab badges: always-visible total (per current scope) + a red dot when
  // the tab holds unseen faults.
  const viewCounts: Partial<Record<FaultViewMode, number>> = {};
  const viewDots: Partial<Record<FaultViewMode, boolean>> = {};
  BOARD_MODES.forEach((m, i) => {
    const d = boardResults[i].data;
    if (d?.totalFault !== undefined) viewCounts[m] = d.totalFault;
    if (d?.hasUnseen) viewDots[m] = true;
  });
  // Picking a "Periodo" re-jumps to the first tab with matches.
  const boardReady =
    scopeResolved &&
    boardResults.every(r => r.data !== undefined) &&
    boardResults.every(r => !r.isFetching);
  useAutoTabSwitchOnFilter<FaultViewMode>({
    triggerKey: `${dateFrom}|${dateTo}`,
    active: Boolean(dateFrom || dateTo),
    activeTab: viewMode,
    order: BOARD_MODES,
    counts: viewCounts,
    ready: boardReady,
    onSwitch: handleModeChange,
  });

  // Filtri (search / date range / sort). Rendered under the scope bar in
  // the content column.
  const filterItems: FiltersItem[] = [
    {
      id: 'search',
      type: 'input',
      label: t('filters.search'),
      value: search,
      placeholder: t('filters.searchPlaceholder'),
      onChange: (v: string) => {
        setSearch(v);
        setPage(1);
      },
      icon: 'search',
    },
    {
      id: 'range',
      type: 'daterange',
      label: t('filters.dateRange'),
      from: dateFrom,
      to: dateTo,
      onChange: (f: string, tv: string) => {
        setDateFrom(f);
        setDateTo(tv);
        setPage(1);
      },
      placeholder: t('filters.dateRangePlaceholder'),
    },
    {
      id: 'sort',
      type: 'select',
      label: t('filters.sortLabel'),
      value:
        sortMapper.getLabelByValue(sortOption) ?? t('filters.sort.auto'),
      options: sortMapper.labelsArray,
      onSelect: (label: string) => {
        setSortOption((sortMapper.getValueByLabel(label) ?? 'auto') as SortKey);
        setPage(1);
      },
    },
  ];
  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setSortOption('auto');
    setPage(1);
  };

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
            plannedDays={plannedDays}
            variant={isCompletedMode ? 'completed' : 'planned'}
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
                dots={viewDots}
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
                scopes={isCompletedMode ? ['mine', 'all'] : undefined}
              />
            </div>

            {/* Filtri — under the scope bar, in the content column. */}
            <div className={css.filtersBar}>
              <Filters items={filterItems} onClear={clearFilters} />
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
                <FaultCardsList
                  faults={items}
                  onClaimed={handleClaimed}
                  period={{ from: dateFrom, to: dateTo }}
                />

                {totalPage > 1 && (
                  <div className={css.paginationWrapper}>
                    <Pagination
                      totalPages={totalPage}
                      page={page}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
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

        {/* The hourly slot grid only makes sense for planned work (it lays
            faults out by plannedTime); deadline/completed tabs skip it. */}
        {MODE_CONFIG[viewMode].field === 'plannedDate' && selectedDate && (
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
