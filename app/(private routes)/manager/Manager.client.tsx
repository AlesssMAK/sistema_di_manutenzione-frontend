'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { usePageStore } from '@/lib/store/pageStore';
import { fetchFaultCards } from '@/lib/api/faults';
import { FaultCard, PriorityFaultType, TypeFault } from '@/types/faultType';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import FaultManagerCard from '@/components/Manager/FaultManagerCard/FaultManagerCard';
import PlanFaultForm from '@/components/forms/PlanFaultForm/PlanFaultForm';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import Pagination from '@/components/UI/Pagination/Pagination';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import css from './Manager.module.css';

type ManagerTab = 'received' | 'inProgress' | 'archive';

const TAB_TO_STATUS: Record<ManagerTab, string> = {
  received: 'Created',
  inProgress: 'In progress,Suspended,Overdue',
  archive: 'Completed',
};

const TAB_ORDER: ManagerTab[] = ['received', 'inProgress', 'archive'];

const PER_PAGE = 8;

const ManagerClient = () => {
  const t = useTranslations('ManagerPage');
  const tNoFound = useTranslations('NoFound');
  const tPriority = useTranslations('Priority');
  const tType = useTranslations('TypeFault');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  const TABS: TabItem<ManagerTab>[] = [
    { value: 'received', label: t('tabs.received') },
    { value: 'inProgress', label: t('tabs.inProgress') },
    { value: 'archive', label: t('tabs.archive') },
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

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, [setPageTitle, t]);

  // Any filter change resets pagination back to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, priority, typeFault, plannedDate]);

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

  // Active filters shared by the list query and the tab counters, so
  // the badges reflect the same filtered totals as the list.
  const filters = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(priority ? { priority } : {}),
    ...(typeFault ? { typeFault } : {}),
    ...(plannedDate ? { plannedDate } : {}),
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['faults', 'manager', activeTab, page, filters],
    queryFn: () =>
      fetchFaultCards({
        page,
        perPage: PER_PAGE,
        statusFault: TAB_TO_STATUS[activeTab],
        ...filters,
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
    setPage(1);
  };

  const handlePlan = (fault: FaultCard) => {
    setPlanningFault(fault);
  };

  const onClearFilters = () => {
    setSearch('');
    setPriority('');
    setTypeFault('');
    setPlannedDate('');
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
  ];

  const faults = data?.fault ?? [];
  const totalPage = data?.totalPage ?? 0;

  return (
    <div className="container">
      <div className={css.pageWrapper}>
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
            />
          ) : faults.length === 0 ? (
            <NoFound
              title={tNoFound('noResultsTitle')}
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
