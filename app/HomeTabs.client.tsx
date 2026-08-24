'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';

import BachecaColumn from '@/components/Bacheca/BachecaColumn/BachecaColumn';
import BroadcastsList from '@/components/Reports/BroadcastsList/BroadcastsList';
import RecentFaultsList from '@/components/Reports/RecentFaultsList/RecentFaultsList';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import Pagination from '@/components/UI/Pagination/Pagination';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import { fetchFaultCards } from '@/lib/api/faults';
import { fetchSystemSettings } from '@/lib/api/systemSettings';
import { getAnnouncements } from '@/lib/api/messages';
import { getAllPlants } from '@/lib/api/plants';
import { useAuthStore } from '@/lib/store/authStore';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import type { PriorityFaultType, TypeFault } from '@/types/faultType';
import type { AnnouncementType } from '@/types/messageType';
import css from './HomeTabs.module.css';

// Public tabs are shown to everyone; the report tabs (broadcasts +
// faults) only appear once a session is present. Tab identity lives in
// the `?tab=` query so the header can deep-link a specific board.
type HomeTab = 'annunci' | 'handover' | 'comunicazioni' | 'segnalazioni';
type FaultStatus =
  | 'Created'
  | 'In progress'
  | 'Suspended'
  | 'Overdue'
  | 'Completed';

const PUBLIC_TABS: HomeTab[] = ['annunci', 'handover'];
const AUTH_TABS: HomeTab[] = ['comunicazioni', 'segnalazioni'];

const PER_PAGE_BROADCASTS = 20;
// Faults are paginated + filtered server-side, so this is a real page
// size (not a fetch-everything cap).
const PER_PAGE_FAULTS = 10;
const DEFAULT_RECENT_FAULTS_DAYS = 30;

const HomeTabsClient = () => {
  const t = useTranslations('reportsAndCommunicationsPage');
  const tBacheca = useTranslations('BachecaPage');
  const tStatus = useTranslations('StatusFault');
  const tPriority = useTranslations('Priority');
  const tType = useTranslations('TypeFault');

  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const canCreate =
    user?.role === 'admin' ||
    user?.permissions?.canCreateAnnouncements === true;

  const availableTabs = useMemo<HomeTab[]>(
    () => (isAuthenticated ? [...PUBLIC_TABS, ...AUTH_TABS] : [...PUBLIC_TABS]),
    [isAuthenticated]
  );

  const tabParam = searchParams.get('tab') as HomeTab | null;
  // Derive the active tab straight from the URL (the source of truth):
  // a guest never lands on an auth-only tab, and an authed deep-link
  // like /?tab=segnalazioni settles on its own once the session
  // hydrates and availableTabs grows — no state, no sync effect.
  const activeTab: HomeTab =
    tabParam && availableTabs.includes(tabParam) ? tabParam : 'annunci';

  const changeTab = (tab: HomeTab) => {
    router.replace(tab === 'annunci' ? '/' : `/?tab=${tab}`, { scroll: false });
  };

  // ── Broadcasts filters (type + read-state hit the API; search is client) ──
  const [bType, setBType] = useState<AnnouncementType | ''>('');
  const [bRead, setBRead] = useState<'all' | 'unread'>('all');
  const [bSearch, setBSearch] = useState('');
  const [bSearchD] = useDebounce(bSearch, 300);

  // ── Faults filters (applied server-side, paginated) ──
  const [fSearch, setFSearch] = useState('');
  const [fSearchD] = useDebounce(fSearch, 300);
  const [fStatus, setFStatus] = useState<FaultStatus | ''>('');
  const [fPriority, setFPriority] = useState<PriorityFaultType | ''>('');
  const [fType, setFType] = useState<TypeFault | ''>('');
  const [fDate, setFDate] = useState('');
  const [fPage, setFPage] = useState(1);

  // Machines for the handover picker (active only). Only fetched when
  // the user can create — readers don't need it.
  const { data: plantsData, isLoading: plantsLoading } = useQuery({
    queryKey: ['plants', 'active'],
    queryFn: () => getAllPlants({ perPage: 200 }),
    placeholderData: keepPreviousData,
    enabled: canCreate,
  });

  const { plantLabels, labelToId } = useMemo(() => {
    const active = (plantsData?.plants ?? []).filter(
      p => p.status === 'active'
    );
    const labels: string[] = [];
    const map = new Map<string, string>();
    for (const p of active) {
      const label = `${p.namePlant} - ${p.code}`;
      labels.push(label);
      map.set(label, p._id);
    }
    return { plantLabels: labels, labelToId: map };
  }, [plantsData]);

  // Report data only makes sense with a session — gated so the public
  // home never fires the auth-only endpoints (would 401).
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
    enabled: isAuthenticated,
  });

  // Admin-controlled window for the Segnalazioni tab. Cached singleton
  // (shared with the maintenance-worker page's query key).
  const { data: settings } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: fetchSystemSettings,
    staleTime: 60 * 60 * 1000,
    enabled: isAuthenticated,
  });

  // Lower bound sent to the API. Undefined = no window (show all). While
  // settings load we fall back to the default window rather than briefly
  // fetching the whole history.
  const dataCreatedFrom = useMemo(() => {
    if (settings?.bacheca?.showAllFaults) return undefined;
    const days =
      settings?.bacheca?.recentFaultsDays ?? DEFAULT_RECENT_FAULTS_DAYS;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }, [settings]);

  // Reset to the first page whenever a filter or the window changes.
  const faultFilterKey = `${fSearchD}|${fStatus}|${fPriority}|${fType}|${fDate}|${dataCreatedFrom ?? 'all'}`;
  const [prevFaultFilterKey, setPrevFaultFilterKey] = useState(faultFilterKey);
  if (prevFaultFilterKey !== faultFilterKey) {
    setPrevFaultFilterKey(faultFilterKey);
    setFPage(1);
  }

  const faultsQuery = useQuery({
    queryKey: ['faults', 'bacheca', fPage, faultFilterKey],
    queryFn: () =>
      fetchFaultCards({
        page: fPage,
        perPage: PER_PAGE_FAULTS,
        ...(fSearchD ? { search: fSearchD } : {}),
        ...(fStatus ? { statusFault: fStatus } : {}),
        ...(fPriority ? { priority: fPriority } : {}),
        ...(fType ? { typeFault: fType } : {}),
        ...(fDate ? { dataCreated: fDate } : {}),
        ...(dataCreatedFrom ? { dataCreatedFrom } : {}),
      }),
    placeholderData: keepPreviousData,
    enabled: isAuthenticated,
  });

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

  // Server-side now — one page as returned.
  const faults = faultsQuery.data?.fault ?? [];
  const faultsTotalPage = faultsQuery.data?.totalPage ?? 0;
  const faultsTotal = faultsQuery.data?.totalFault ?? 0;

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
    if (activeTab === 'comunicazioni') {
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

  const tabLabels: Record<HomeTab, string> = {
    annunci: tBacheca('sections.announcement.title'),
    handover: tBacheca('sections.handover.title'),
    comunicazioni: t('tabs.broadcasts'),
    segnalazioni: t('tabs.faults'),
  };

  // Sprite icon per tab — shown instead of the label on phones.
  const tabIcons: Record<HomeTab, string> = {
    annunci: 'megaphone',
    handover: 'package',
    comunicazioni: 'message-square',
    segnalazioni: 'alert-triangle',
  };

  const TABS: TabItem<HomeTab>[] = availableTabs.map(value => ({
    value,
    label: tabLabels[value],
    icon: tabIcons[value],
  }));

  const counts: Partial<Record<HomeTab, number>> = {
    comunicazioni: broadcasts.length,
    segnalazioni: faultsTotal,
  };

  const showFilters =
    activeTab === 'comunicazioni' || activeTab === 'segnalazioni';

  return (
    <main className={css.main}>
      <div className="container">
        <div className={css.tabsBarWrap}>
          <Tabs<HomeTab>
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={changeTab}
            counts={counts}
          />
        </div>

        {showFilters && (
          <div className={css.filtersWrap}>
            <Filters
              items={
                activeTab === 'comunicazioni'
                  ? broadcastFilterItems
                  : faultFilterItems
              }
              onClear={onClearFilters}
            />
          </div>
        )}

        <div className={css.contentSection}>
          {activeTab === 'annunci' && (
            <BachecaColumn
              category="announcement"
              canCreate={canCreate}
              withSeverity
              gridLayout
            />
          )}
          {activeTab === 'handover' && (
            <BachecaColumn
              category="handover"
              canCreate={canCreate}
              withMachine
              plantLabels={plantLabels}
              resolvePlantId={label => labelToId.get(label) ?? ''}
              plantsLoading={plantsLoading}
            />
          )}
          {activeTab === 'comunicazioni' && (
            <BroadcastsList
              items={broadcasts}
              isLoading={broadcastsQuery.isLoading}
              isError={broadcastsQuery.isError}
            />
          )}
          {activeTab === 'segnalazioni' && (
            <>
              <RecentFaultsList
                items={faults}
                isLoading={faultsQuery.isLoading}
                isError={faultsQuery.isError}
              />
              {faultsTotalPage > 1 && (
                <div className={css.paginationWrap}>
                  <Pagination
                    totalPages={faultsTotalPage}
                    page={fPage}
                    onPageChange={setFPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default HomeTabsClient;
