'use client';

import PlanFaultForm from '@/components/forms/PlanFaultForm/PlanFaultForm';
import FaultManagerCard from '@/components/Manager/FaultManagerCard/FaultManagerCard';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import {
  fetchFaultCards,
  fetchListSeen,
  markListSeen,
  type ListSeenKey,
} from '@/lib/api/faults';

import { useAutoTabSwitch } from '@/lib/hooks/useAutoTabSwitch';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import { FaultCard, PriorityFaultType, TypeFault } from '@/types/faultType';
import {
  keepPreviousData,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import css from './Manager.module.css';

type ManagerTab =
  | 'received'
  | 'planned'
  | 'suspended'
  | 'inProgress'
  | 'archive';

const TAB_TO_STATUS: Record<ManagerTab, string> = {
  // "Ricevute" and "Pianificati" are both Created — split by whether the
  // manager has already assigned/planned them (see TAB_EXTRA below).
  received: 'Created',
  planned: 'Created',
  suspended: 'Suspended',
  // Suspended has its own tab, so it's excluded here — a paused fault
  // shows only under "Sospese", not also under "In Lavorazione".
  inProgress: 'In progress,Overdue',
  archive: 'Completed',
};

// Ricevute = Created not yet planned (no plannedDate); Pianificate =
// Created already planned (a plannedDate is set). Splitting by plannedDate
// (not assignment) matches the card's own "isPlanned" logic — a fault
// planned without assigned maintainers still leaves "Ricevute".
const TAB_EXTRA: Partial<
  Record<ManagerTab, { plannedDateEmpty?: boolean; plannedDateNotEmpty?: boolean }>
> = {
  received: { plannedDateEmpty: true },
  planned: { plannedDateNotEmpty: true },
};

const TAB_ORDER: ManagerTab[] = [
  'received',
  'planned',
  'inProgress',
  'suspended',
  'archive',
];

// Dot-free listSeen keys (model A: faults assigned to technicians clear
// on tab open; unassigned "received" faults are model B).
const TAB_SEEN_KEY: Record<ManagerTab, ListSeenKey> = {
  received: 'manager_received',
  planned: 'manager_planned',
  suspended: 'manager_suspended',
  inProgress: 'manager_inprogress',
  archive: 'manager_archive',
};

// Specific statuses inside each tab's group — drive the status filter.
const TAB_STATUSES: Record<ManagerTab, string[]> = {
  received: ['Created'],
  planned: ['Created'],
  suspended: ['Suspended'],
  inProgress: ['In progress', 'Overdue'],
  archive: ['Completed'],
};
const STATUS_KEY: Record<string, string> = {
  Created: 'CREATED',
  'In progress': 'IN_PROGRESS',
  Suspended: 'SUSPENDED',
  Overdue: 'OVERDUE',
  Completed: 'COMPLETED',
};

// Date sort presets → fetchFaultCards params (createdAt via `sort`,
// other fields via sortBy/sortOrder).
type SortKey = 'recent' | 'oldest' | 'deadlineNear' | 'deadlineFar';
const SORT_CONFIG: Record<
  SortKey,
  { sort?: 'asc' | 'desc'; sortBy?: string; sortOrder?: 'asc' | 'desc' }
> = {
  recent: { sort: 'desc' },
  oldest: { sort: 'asc' },
  deadlineNear: { sortBy: 'deadline', sortOrder: 'asc' },
  deadlineFar: { sortBy: 'deadline', sortOrder: 'desc' },
};

const PER_PAGE = 8;

const ManagerClient = () => {
  const t = useTranslations('ManagerPage');
  const tNoFound = useTranslations('NoFound');
  const tPriority = useTranslations('Priority');
  const tType = useTranslations('TypeFault');
  const tStatus = useTranslations('StatusFault');
  const TABS: TabItem<ManagerTab>[] = [
    { value: 'received', label: t('tabs.received'), icon: 'clipboard' },
    { value: 'planned', label: t('tabs.planned'), icon: 'clock' },
    { value: 'inProgress', label: t('tabs.inProgress'), icon: 'reload' },
    { value: 'suspended', label: t('tabs.suspended'), icon: 'exclamation-circle' },
    { value: 'archive', label: t('tabs.archive'), icon: 'archive' },
  ];

  const [activeTab, setActiveTab] = useState<ManagerTab>('received');
  const [page, setPage] = useState(1);
  const [planningFault, setPlanningFault] = useState<FaultCard | null>(null);

  // Filters (status stays on the tabs). search → faultId/operator,
  // priority/typeFault → selects, "Periodo" → any-date range.
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [priority, setPriority] = useState<PriorityFaultType | ''>('');
  const [typeFault, setTypeFault] = useState<TypeFault | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // Date sort + a specific-status filter (narrows the tab's status group).
  const [sortOption, setSortOption] = useState<SortKey>('recent');
  const [statusFilter, setStatusFilter] = useState('');

  // Any filter change resets pagination back to the first page. Adjusted
  // during render rather than in an effect so the reset lands in the same
  // pass as the filter change (no cascading render).
  const filterKey = `${debouncedSearch}|${priority}|${typeFault}|${dateFrom}|${dateTo}|${statusFilter}|${sortOption}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const priorityMapper = useMemo(
    () =>
      createOptionMapper<PriorityFaultType | ''>([
        { value: '', label: t('filters.allPriorities') },
        { value: 'Low', label: tPriority('Low') },
        { value: 'Medium', label: tPriority('Medium') },
        { value: 'High', label: tPriority('High') },
      ]),
    [t, tPriority]
  );

  const typeMapper = useMemo(
    () =>
      createOptionMapper<TypeFault | ''>([
        { value: '', label: t('filters.allTypes') },
        { value: 'Production', label: tType('PRODUCTION') },
        { value: 'Safety', label: tType('SAFETY') },
      ]),
    [t, tType]
  );

  const sortMapper = useMemo(
    () =>
      createOptionMapper<SortKey>([
        { value: 'recent', label: t('filters.sort.recent') },
        { value: 'oldest', label: t('filters.sort.oldest') },
        { value: 'deadlineNear', label: t('filters.sort.deadlineNear') },
        { value: 'deadlineFar', label: t('filters.sort.deadlineFar') },
      ]),
    [t]
  );

  // Status options are the specific statuses inside the active tab.
  const statusMapper = useMemo(
    () =>
      createOptionMapper<string>([
        { value: '', label: t('filters.allStatuses') },
        ...TAB_STATUSES[activeTab].map(s => ({
          value: s,
          label: tStatus(STATUS_KEY[s]),
        })),
      ]),
    [t, tStatus, activeTab]
  );

  // Active filters shared by the list query and the tab counters, so
  // the badges reflect the same filtered totals as the list.
  const filters = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(priority ? { priority } : {}),
    ...(typeFault ? { typeFault } : {}),
    ...(dateFrom ? { anyDateFrom: dateFrom } : {}),
    ...(dateTo ? { anyDateTo: dateTo } : {}),
  };

  const queryClient = useQueryClient();

  // Per-list lastSeen timestamps (drive model A for technician-assigned
  // faults). Fed back as seenSince per tab.
  const { data: listSeen } = useQuery({
    queryKey: ['listSeen'],
    queryFn: fetchListSeen,
    staleTime: 30 * 1000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'faults',
      'manager',
      activeTab,
      page,
      filters,
      statusFilter,
      sortOption,
      listSeen?.[TAB_SEEN_KEY[activeTab]] ?? null,
    ],
    queryFn: () =>
      fetchFaultCards({
        page,
        perPage: PER_PAGE,
        // A specific status narrows the tab's group; otherwise the whole
        // group is shown.
        statusFault: statusFilter || TAB_TO_STATUS[activeTab],
        ...(TAB_EXTRA[activeTab] ?? {}),
        ...filters,
        ...SORT_CONFIG[sortOption],
        withUnseen: true,
        ...(listSeen?.[TAB_SEEN_KEY[activeTab]]
          ? { seenSince: listSeen[TAB_SEEN_KEY[activeTab]] }
          : {}),
      }),
    placeholderData: keepPreviousData,
  });

  const countsResults = useQueries({
    queries: TAB_ORDER.map(tab => {
      const since = listSeen?.[TAB_SEEN_KEY[tab]];
      return {
        queryKey: ['faults', 'manager', tab, 'count', filters, since ?? null],
        queryFn: () =>
          fetchFaultCards({
            page: 1,
            perPage: 1,
            statusFault: TAB_TO_STATUS[tab],
            ...(TAB_EXTRA[tab] ?? {}),
            ...filters,
            withUnseen: true,
            ...(since ? { seenSince: since } : {}),
          }),
        placeholderData: keepPreviousData,
      };
    }),
  });

  const counts = TAB_ORDER.reduce<Partial<Record<ManagerTab, number>>>(
    (acc, tab, i) => {
      const total = countsResults[i].data?.totalFault;
      if (total !== undefined) acc[tab] = total;
      return acc;
    },
    {}
  );

  // Per-tab unseen dots.
  const dots = TAB_ORDER.reduce<Partial<Record<ManagerTab, boolean>>>(
    (acc, tab, i) => {
      if (countsResults[i].data?.hasUnseen) acc[tab] = true;
      return acc;
    },
    {}
  );

  const markTabSeen = (tab: ManagerTab) => {
    markListSeen(TAB_SEEN_KEY[tab])
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['listSeen'] });
        queryClient.invalidateQueries({ queryKey: ['faults', 'manager'] });
      })
      .catch(() => {});
  };

  const handleTabChange = (tab: ManagerTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    // The status options belong to the tab, so drop a stale selection.
    setStatusFilter('');
    setPage(1);
    // Opening a tab clears its technician-assigned (model A) cards.
    markTabSeen(tab);
  };

  // Mark the landing tab seen once, so its model-A cards start cleared.
  const landedRef = useRef(false);
  useEffect(() => {
    if (landedRef.current) return;
    landedRef.current = true;
    markTabSeen(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the active filter leaves the current tab empty but matches in
  // another, jump to the first tab (in order) that has results. Waits
  // until every per-tab count has settled so loading never triggers it.
  const countsReady =
    countsResults.every(r => r.data !== undefined) &&
    countsResults.every(r => !r.isFetching);
  useAutoTabSwitch<ManagerTab>({
    activeTab,
    order: TAB_ORDER,
    counts,
    ready: countsReady,
    onSwitch: handleTabChange,
  });

  const handlePlan = (fault: FaultCard) => {
    setPlanningFault(fault);
  };

  const onClearFilters = () => {
    setSearch('');
    setPriority('');
    setTypeFault('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setSortOption('recent');
  };

  const filterItems: FiltersItem[] = [
    {
      id: 'search',
      type: 'input',
      label: t('filters.search'),
      value: search,
      onChange: setSearch,
      placeholder: t('filters.searchPlaceholder'),
      icon: 'search',
    },
    // Status filter — only where the tab groups more than one status
    // (In lavorazione). Narrows the group to a single status.
    ...(TAB_STATUSES[activeTab].length > 1
      ? [
          {
            id: 'status',
            type: 'select' as const,
            label: t('filters.status'),
            value:
              statusMapper.getLabelByValue(statusFilter) ??
              t('filters.allStatuses'),
            options: statusMapper.labelsArray,
            onSelect: (label: string) =>
              setStatusFilter(statusMapper.getValueByLabel(label) ?? ''),
          },
        ]
      : []),
    {
      id: 'priority',
      type: 'select',
      label: t('filters.priority'),
      value:
        priorityMapper.getLabelByValue(priority) ?? t('filters.allPriorities'),
      options: priorityMapper.labelsArray,
      onSelect: label =>
        setPriority(priorityMapper.getValueByLabel(label) ?? ''),
    },
    {
      id: 'type',
      type: 'select',
      label: t('filters.type'),
      value: typeMapper.getLabelByValue(typeFault) ?? t('filters.allTypes'),
      options: typeMapper.labelsArray,
      onSelect: label => setTypeFault(typeMapper.getValueByLabel(label) ?? ''),
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
      },
      placeholder: t('filters.dateRangePlaceholder'),
    },
    {
      id: 'sort',
      type: 'select',
      label: t('filters.sortLabel'),
      value: sortMapper.getLabelByValue(sortOption) ?? t('filters.sort.recent'),
      options: sortMapper.labelsArray,
      onSelect: label =>
        setSortOption((sortMapper.getValueByLabel(label) ?? 'recent') as SortKey),
    },
  ];

  const faults = data?.fault ?? [];
  const totalPage = data?.totalPage ?? 0;

  return (
    <div className="container">
      <div className={css.page_wrapper}>
        <h2 className="title">{t('headerTitle')}</h2>
        <p className="subtitle">{t('headerSubtitle')}</p>

        <div className={css.filtersWrap}>
          <Filters items={filterItems} onClear={onClearFilters} />
        </div>

        <div className={css.tabsBarWrap}>
          <Tabs<ManagerTab>
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            counts={counts}
            dots={dots}
          />
        </div>

        <div className={css.contentSection}>
          {isLoading ? (
            <div className={css.loadingWrap}>
              <Loader />
            </div>
          ) : isError ? (
            <NoFound
              title={tNoFound('serverErrorTitle')}
              message={tNoFound('serverErrorMessage')}
              hideIcon
            />
          ) : faults.length === 0 ? (
            <NoFound
              title={tNoFound('emptyTitle')}
              message={t(`empty.${activeTab}`)}
            />
          ) : (
            <ul className={css.cardList}>
              {faults.map(fault => (
                <FaultManagerCard
                  key={fault._id}
                  fault={fault}
                  onPlan={activeTab === 'archive' ? undefined : handlePlan}
                />
              ))}
            </ul>
          )}

          {totalPage > 1 && (
            <div className={css.paginationWrapper}>
              <Pagination
                totalPages={totalPage}
                page={page}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        {planningFault && (
          <PlanFaultForm
            fault={planningFault}
            onClose={() => setPlanningFault(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ManagerClient;
