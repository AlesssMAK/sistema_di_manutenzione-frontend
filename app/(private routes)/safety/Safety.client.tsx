'use client';

import FaultManagerCard from '@/components/Manager/FaultManagerCard/FaultManagerCard';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import {
  fetchFaultCards,
  fetchListSeen,
  markListSeen,
} from '@/lib/api/faults';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import { useAutoTabSwitchOnFilter } from '@/lib/hooks/useAutoTabSwitchOnFilter';
import {
  keepPreviousData,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import css from './Safety.module.css';

type SafetyTab =
  | 'libere'
  | 'inProgress'
  | 'suspended'
  | 'overdue'
  | 'completed';

// One status per tab — the tabs effectively ARE the status filter, so no
// separate Stato dropdown is needed.
const TAB_TO_STATUS: Record<SafetyTab, string> = {
  libere: 'Created',
  inProgress: 'In progress',
  suspended: 'Suspended',
  overdue: 'Overdue',
  completed: 'Completed',
};

const TAB_ORDER: SafetyTab[] = [
  'libere',
  'inProgress',
  'suspended',
  'overdue',
  'completed',
];

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

const SafetyClient = () => {
  const t = useTranslations('SafetyPage');
  const tNoFound = useTranslations('NoFound');
  const queryClient = useQueryClient();

  const TABS: TabItem<SafetyTab>[] = [
    { value: 'libere', label: t('tabs.libere'), icon: 'clipboard' },
    { value: 'inProgress', label: t('tabs.inProgress'), icon: 'reload' },
    { value: 'suspended', label: t('tabs.suspended'), icon: 'exclamation-circle' },
    { value: 'overdue', label: t('tabs.overdue'), icon: 'clock' },
    { value: 'completed', label: t('tabs.completed'), icon: 'check-circle' },
  ];

  const [activeTab, setActiveTab] = useState<SafetyTab>('libere');
  const [page, setPage] = useState(1);

  // Filters: text search, a planned-date range and a date sort. (Status is
  // the tabs themselves, so there's no separate Stato filter.)
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOption, setSortOption] = useState<SortKey>('recent');

  // Any filter change resets pagination (same-pass reset, no effect).
  const filterKey = `${debouncedSearch}|${dateFrom}|${dateTo}|${sortOption}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

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

  // Per-list lastSeen (drives model A for assigned safety faults).
  const { data: listSeen } = useQuery({
    queryKey: ['listSeen'],
    queryFn: fetchListSeen,
    staleTime: 30 * 1000,
  });
  const since = listSeen?.safety_all;

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'faults',
      'safety',
      activeTab,
      page,
      filterKey,
      since ?? null,
    ],
    queryFn: () =>
      fetchFaultCards({
        page,
        perPage: PER_PAGE,
        typeFault: 'Safety',
        statusFault: TAB_TO_STATUS[activeTab],
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(dateFrom ? { anyDateFrom: dateFrom } : {}),
        ...(dateTo ? { anyDateTo: dateTo } : {}),
        ...SORT_CONFIG[sortOption],
        withUnseen: true,
        ...(since ? { seenSince: since } : {}),
      }),
    placeholderData: keepPreviousData,
  });

  // The Filtri narrowers the tab counters mirror (search + Periodo), so a
  // badge equals the filtered list total.
  const countFilters = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(dateFrom ? { anyDateFrom: dateFrom } : {}),
    ...(dateTo ? { anyDateTo: dateTo } : {}),
  };
  const countFilterKey = `${debouncedSearch}|${dateFrom}|${dateTo}`;

  // Per-tab totals for the tab badges, filtered the same as the list.
  const countsResults = useQueries({
    queries: TAB_ORDER.map(tab => ({
      queryKey: ['faults', 'safety', tab, 'count', countFilterKey],
      queryFn: () =>
        fetchFaultCards({
          page: 1,
          perPage: 1,
          typeFault: 'Safety',
          statusFault: TAB_TO_STATUS[tab],
          ...countFilters,
        }),
      placeholderData: keepPreviousData,
    })),
  });
  const counts = TAB_ORDER.reduce<Partial<Record<SafetyTab, number>>>(
    (acc, tab, i) => {
      const total = countsResults[i].data?.totalFault;
      if (total !== undefined) acc[tab] = total;
      return acc;
    },
    {}
  );

  // Mark the safety board seen once on landing — clears its assigned
  // (model A) cards. Unassigned safety faults (pool / model B) keep their
  // dots until opened individually.
  const landedRef = useRef(false);
  useEffect(() => {
    if (landedRef.current) return;
    landedRef.current = true;
    markListSeen('safety_all')
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['listSeen'] });
        queryClient.invalidateQueries({ queryKey: ['faults', 'safety'] });
      })
      .catch(() => {});
  }, [queryClient]);

  const faults = data?.fault ?? [];
  const totalPage = data?.totalPage ?? 0;

  const handleTabChange = (tab: SafetyTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
  };

  // Picking a "Periodo" re-jumps to the first tab with matches.
  const countsReady =
    countsResults.every(r => r.data !== undefined) &&
    countsResults.every(r => !r.isFetching);
  useAutoTabSwitchOnFilter<SafetyTab>({
    triggerKey: `${dateFrom}|${dateTo}`,
    active: Boolean(dateFrom || dateTo),
    activeTab,
    order: TAB_ORDER,
    counts,
    ready: countsReady,
    onSwitch: handleTabChange,
  });

  const handleClear = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setSortOption('recent');
  };

  const filterItems: FiltersItem[] = [
    {
      id: 'search',
      type: 'input',
      label: t('filters.search'),
      value: search,
      placeholder: t('filters.searchPlaceholder'),
      onChange: setSearch,
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
      },
      placeholder: t('filters.dateRangePlaceholder'),
    },
    {
      id: 'sort',
      type: 'select',
      label: t('filters.sortLabel'),
      value: sortMapper.getLabelByValue(sortOption) ?? t('filters.sort.recent'),
      options: sortMapper.labelsArray,
      onSelect: (label: string) =>
        setSortOption((sortMapper.getValueByLabel(label) ?? 'recent') as SortKey),
    },
  ];

  return (
    <div className="container">
      <div className={css.page_wrapper}>
        <h2 className="title">
          {t('headerTitle')}
          <span className={css.safetyBadge}>{t('badge')}</span>
        </h2>
        <p className="subtitle">{t('headerSubtitle')}</p>

        <div className={css.tabsBarWrap}>
          <Tabs<SafetyTab>
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            counts={counts}
          />
        </div>

        <div className={css.filtersWrap}>
          <Filters items={filterItems} onClear={handleClear} />
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
                  detailHref={f => `/safety/${f._id}`}
                  period={{ from: dateFrom, to: dateTo }}
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
      </div>
    </div>
  );
};

export default SafetyClient;
