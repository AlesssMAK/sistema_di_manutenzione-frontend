'use client';

import BroadcastsList from '@/components/Reports/BroadcastsList/BroadcastsList';
import RecentFaultsList from '@/components/Reports/RecentFaultsList/RecentFaultsList';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import { fetchFaultCards } from '@/lib/api/faults';
import { getAnnouncements } from '@/lib/api/messages';
import { usePageStore } from '@/lib/store/pageStore';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import type { PriorityFaultType, TypeFault } from '@/types/faultType';
import type { AnnouncementType } from '@/types/messageType';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import css from './page.module.css';

type ReportTab = 'broadcasts' | 'faults';
type FaultStatus =
  | 'Created'
  | 'In progress'
  | 'Suspended'
  | 'Overdue'
  | 'Completed';

const PER_PAGE_BROADCASTS = 20;
// Generous cap so a single fetch covers ~a month of activity; the page
// then trims to the last 30 days and filters client-side.
const PER_PAGE_FAULTS = 100;

const ReportsAndCommunicationsClient = () => {
  const t = useTranslations('reportsAndCommunicationsPage');
  const tStatus = useTranslations('StatusFault');
  const tPriority = useTranslations('Priority');
  const tType = useTranslations('TypeFault');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  const [activeTab, setActiveTab] = useState<ReportTab>('broadcasts');

  // ── Broadcasts filters (type + read-state hit the API; search is client) ──
  const [bType, setBType] = useState<AnnouncementType | ''>('');
  const [bRead, setBRead] = useState<'all' | 'unread'>('all');
  const [bSearch, setBSearch] = useState('');
  const [bSearchD] = useDebounce(bSearch, 300);

  // ── Faults filters (all client-side over the 30-day window) ──
  const [fSearch, setFSearch] = useState('');
  const [fSearchD] = useDebounce(fSearch, 300);
  const [fStatus, setFStatus] = useState<FaultStatus | ''>('');
  const [fPriority, setFPriority] = useState<PriorityFaultType | ''>('');
  const [fType, setFType] = useState<TypeFault | ''>('');
  const [fDate, setFDate] = useState('');

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, [setPageTitle, t]);

  const broadcastsQuery = useQuery({
    queryKey: ['messages', 'announcements-report', bType, bRead],
    queryFn: () =>
      getAnnouncements({
        page: 1,
        perPage: PER_PAGE_BROADCASTS,
        ...(bType ? { types: [bType] } : {}),
        ...(bRead === 'unread' ? { unreadOnly: true } : {}),
      }),
    placeholderData: keepPreviousData,
  });

  const faultsQuery = useQuery({
    queryKey: ['faults', 'recent-30d-report'],
    queryFn: () => fetchFaultCards({ page: 1, perPage: PER_PAGE_FAULTS }),
    placeholderData: keepPreviousData,
  });

  // dataCreated is YYYY-MM-DD; lexicographic compare matches chronological.
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const broadcasts = useMemo(() => {
    const items = broadcastsQuery.data?.items ?? [];
    const q = bSearchD.trim().toLowerCase();
    if (!q) return items;
    return items.filter(m => {
      const author =
        typeof m.authorId === 'object' && m.authorId
          ? m.authorId.fullName
          : m.authorName;
      return [m.subject, m.body, author].some(v =>
        (v ?? '').toLowerCase().includes(q)
      );
    });
  }, [broadcastsQuery.data, bSearchD]);

  const faults = useMemo(() => {
    let list = (faultsQuery.data?.fault ?? []).filter(
      f => (f.dataCreated ?? '') >= cutoff
    );
    const q = fSearchD.trim().toLowerCase();
    if (q) {
      list = list.filter(f =>
        [f.faultId, f.nameOperator, f.plantId?.namePlant].some(v =>
          (v ?? '').toLowerCase().includes(q)
        )
      );
    }
    if (fStatus) list = list.filter(f => f.statusFault === fStatus);
    if (fPriority) list = list.filter(f => f.priority === fPriority);
    if (fType) list = list.filter(f => f.typeFault === fType);
    if (fDate) list = list.filter(f => f.dataCreated === fDate);
    return list;
  }, [faultsQuery.data, cutoff, fSearchD, fStatus, fPriority, fType, fDate]);

  // ── Select option mappers (label ⇄ value) ──
  const broadcastTypeMapper = useMemo(
    () =>
      createOptionMapper<AnnouncementType | ''>([
        { value: '', label: t('filters.allBroadcastTypes') },
        { value: 'broadcast_all', label: t('broadcastBadge.all') },
        { value: 'broadcast_role', label: t('broadcastBadge.role') },
      ]),
    [t]
  );

  const readStateMapper = useMemo(
    () =>
      createOptionMapper<'all' | 'unread'>([
        { value: 'all', label: t('filters.allMessages') },
        { value: 'unread', label: t('filters.unreadOnly') },
      ]),
    [t]
  );

  const statusMapper = useMemo(
    () =>
      createOptionMapper<FaultStatus | ''>([
        { value: '', label: t('filters.allStatuses') },
        { value: 'Created', label: tStatus('CREATED') },
        { value: 'In progress', label: tStatus('IN_PROGRESS') },
        { value: 'Suspended', label: tStatus('SUSPENDED') },
        { value: 'Overdue', label: tStatus('OVERDUE') },
        { value: 'Completed', label: tStatus('COMPLETED') },
      ]),
    [t, tStatus]
  );

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

  const broadcastFilterItems: FiltersItem[] = [
    {
      id: 'b-search',
      type: 'input',
      label: t('filters.search'),
      value: bSearch,
      onChange: setBSearch,
      placeholder: t('filters.searchBroadcastsPlaceholder'),
      icon: 'search',
    },
    {
      id: 'b-type',
      type: 'select',
      label: t('filters.broadcastType'),
      value:
        broadcastTypeMapper.getLabelByValue(bType) ??
        t('filters.allBroadcastTypes'),
      options: broadcastTypeMapper.labelsArray,
      onSelect: label =>
        setBType(broadcastTypeMapper.getValueByLabel(label) ?? ''),
    },
    {
      id: 'b-read',
      type: 'select',
      label: t('filters.readState'),
      value: readStateMapper.getLabelByValue(bRead) ?? t('filters.allMessages'),
      options: readStateMapper.labelsArray,
      onSelect: label =>
        setBRead(readStateMapper.getValueByLabel(label) ?? 'all'),
    },
  ];

  const faultFilterItems: FiltersItem[] = [
    {
      id: 'f-search',
      type: 'input',
      label: t('filters.search'),
      value: fSearch,
      onChange: setFSearch,
      placeholder: t('filters.searchFaultsPlaceholder'),
      icon: 'search',
    },
    {
      id: 'f-status',
      type: 'select',
      label: t('filters.status'),
      value: statusMapper.getLabelByValue(fStatus) ?? t('filters.allStatuses'),
      options: statusMapper.labelsArray,
      onSelect: label => setFStatus(statusMapper.getValueByLabel(label) ?? ''),
    },
    {
      id: 'f-priority',
      type: 'select',
      label: t('filters.priority'),
      value:
        priorityMapper.getLabelByValue(fPriority) ?? t('filters.allPriorities'),
      options: priorityMapper.labelsArray,
      onSelect: label =>
        setFPriority(priorityMapper.getValueByLabel(label) ?? ''),
    },
    {
      id: 'f-type',
      type: 'select',
      label: t('filters.type'),
      value: typeMapper.getLabelByValue(fType) ?? t('filters.allTypes'),
      options: typeMapper.labelsArray,
      onSelect: label => setFType(typeMapper.getValueByLabel(label) ?? ''),
    },
    {
      id: 'f-date',
      type: 'date',
      label: t('filters.date'),
      value: fDate,
      onChange: setFDate,
      placeholder: t('filters.datePlaceholder'),
    },
  ];

  const onClearFilters = () => {
    if (activeTab === 'broadcasts') {
      setBSearch('');
      setBType('');
      setBRead('all');
    } else {
      setFSearch('');
      setFStatus('');
      setFPriority('');
      setFType('');
      setFDate('');
    }
  };

  const TABS: TabItem<ReportTab>[] = [
    { value: 'broadcasts', label: t('tabs.broadcasts') },
    { value: 'faults', label: t('tabs.faults') },
  ];

  const counts: Partial<Record<ReportTab, number>> = {
    broadcasts: broadcasts.length,
    faults: faults.length,
  };

  return (
    <div className="container">
      <div className={css.page_wrapper}>
        <h2 className="title">{t('title')}</h2>
        <p className="subtitle">{t('subtitle')}</p>

        <div className={css.tabsBarWrap}>
          <Tabs<ReportTab>
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
          />
        </div>

        <div className={css.filtersWrap}>
          <Filters
            items={
              activeTab === 'broadcasts'
                ? broadcastFilterItems
                : faultFilterItems
            }
            onClear={onClearFilters}
          />
        </div>

        <div className={css.contentSection}>
          {activeTab === 'broadcasts' ? (
            <BroadcastsList
              items={broadcasts}
              isLoading={broadcastsQuery.isLoading}
              isError={broadcastsQuery.isError}
            />
          ) : (
            <RecentFaultsList
              items={faults}
              isLoading={faultsQuery.isLoading}
              isError={faultsQuery.isError}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsAndCommunicationsClient;
