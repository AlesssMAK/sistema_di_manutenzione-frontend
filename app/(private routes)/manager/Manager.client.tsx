'use client';

import PlanFaultForm from '@/components/forms/PlanFaultForm/PlanFaultForm';
import FaultManagerCard from '@/components/Manager/FaultManagerCard/FaultManagerCard';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import { fetchFaultCards } from '@/lib/api/faults';

import { useAutoTabSwitch } from '@/lib/hooks/useAutoTabSwitch';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import { FaultCard, PriorityFaultType, TypeFault } from '@/types/faultType';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import css from './Manager.module.css';

type ManagerTab = 'received' | 'inProgress' | 'archive';

const TAB_TO_STATUS: Record<ManagerTab, string> = {
  received: 'Created',
  inProgress: 'In progress,Suspended,Overdue',
  archive: 'Completed',
};

const TAB_ORDER: ManagerTab[] = ['received', 'inProgress', 'archive'];

// Specific statuses inside each tab's group — drive the status filter.
const TAB_STATUSES: Record<ManagerTab, string[]> = {
  received: ['Created'],
  inProgress: ['In progress', 'Suspended', 'Overdue'],
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
    { value: 'inProgress', label: t('tabs.inProgress'), icon: 'reload' },
    { value: 'archive', label: t('tabs.archive'), icon: 'archive' },
  ];

  const [activeTab, setActiveTab] = useState<ManagerTab>('received');
  const [page, setPage] = useState(1);
  const [planningFault, setPlanningFault] = useState<FaultCard | null>(null);

  // Filters (status stays on the tabs). search → faultId/operator,
  // priority/typeFault → selects, plannedDate → localized date picker.
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [priority, setPriority] = useState<PriorityFaultType | ''>('');
  const [typeFault, setTypeFault] = useState<TypeFault | ''>('');
  const [plannedDate, setPlannedDate] = useState('');
  // Date sort + a specific-status filter (narrows the tab's status group).
  const [sortOption, setSortOption] = useState<SortKey>('recent');
  const [statusFilter, setStatusFilter] = useState('');

  // Any filter change resets pagination back to the first page. Adjusted
  // during render rather than in an effect so the reset lands in the same
  // pass as the filter change (no cascading render).
  const filterKey = `${debouncedSearch}|${priority}|${typeFault}|${plannedDate}|${statusFilter}|${sortOption}`;
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
    ...(plannedDate ? { plannedDate } : {}),
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'faults',
      'manager',
      activeTab,
      page,
      filters,
      statusFilter,
      sortOption,
    ],
    queryFn: () =>
      fetchFaultCards({
        page,
        perPage: PER_PAGE,
        // A specific status narrows the tab's group; otherwise the whole
        // group is shown.
        statusFault: statusFilter || TAB_TO_STATUS[activeTab],
        ...filters,
        ...SORT_CONFIG[sortOption],
      }),
    placeholderData: keepPreviousData,
  });

  const countsResults = useQueries({
    queries: TAB_ORDER.map(tab => ({
      queryKey: ['faults', 'manager', tab, 'count', filters],
      queryFn: () =>
        fetchFaultCards({
          page: 1,
          perPage: 1,
          statusFault: TAB_TO_STATUS[tab],
          ...filters,
        }),
      placeholderData: keepPreviousData,
    })),
  });

  const counts = TAB_ORDER.reduce<Partial<Record<ManagerTab, number>>>(
    (acc, tab, i) => {
      const total = countsResults[i].data?.totalFault;
      if (total !== undefined) acc[tab] = total;
      return acc;
    },
    {}
  );

  const handleTabChange = (tab: ManagerTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    // The status options belong to the tab, so drop a stale selection.
    setStatusFilter('');
    setPage(1);
  };

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
    setPlannedDate('');
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
      id: 'plannedDate',
      type: 'date',
      label: t('filters.plannedDate'),
      value: plannedDate,
      onChange: setPlannedDate,
      placeholder: t('filters.datePlaceholder'),
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
