'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useDebounce } from 'use-debounce';
import { usePageStore } from '@/lib/store/pageStore';
import { getAuditLogs } from '@/lib/api/auditLog';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import LogsAuditList from '@/components/Admin/LogsAuditList/LogsAuditList';
import LogAuditDetailModal from '@/components/Admin/LogsAuditList/LogAuditDetailModal/LogAuditDetailModal';
import type {
  AuditActorRole,
  AuditLogEntry,
  AuditLogListParams,
} from '@/types/auditLogType';
import css from './LogsAudit.module.css';

type AuditTab = 'access' | 'changes';

const PER_PAGE = 10;

const ACTOR_ROLES: AuditActorRole[] = [
  'admin',
  'manager',
  'maintenanceWorker',
  'safety',
  'operator',
  'system',
];

const AdminLogsAuditClientPage = () => {
  const t = useTranslations('AdminPage.LogsAudit');
  const tPage = useTranslations('AdminPage');
  const tRoles = useTranslations('Roles');
  const tNoFound = useTranslations('NoFound');
  const setPageTitle = usePageStore((s) => s.setPageTitle);

  const [openEntry, setOpenEntry] = useState<AuditLogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<AuditTab>('access');

  // Shared filters apply to both tabs; each tab paginates
  // independently.
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [actorRole, setActorRole] = useState<AuditActorRole | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [accessPage, setAccessPage] = useState(1);
  const [changesPage, setChangesPage] = useState(1);

  useEffect(() => {
    setPageTitle(tPage('titlePageForStore'));
  }, [setPageTitle, tPage]);

  // Any filter change invalidates the current page on both tabs.
  useEffect(() => {
    setAccessPage(1);
    setChangesPage(1);
  }, [debouncedSearch, actorRole, from, to]);

  const roleMapper = useMemo(
    () =>
      createOptionMapper([
        { value: '', label: t('filters.allRoles') },
        ...ACTOR_ROLES.map((r) => ({
          value: r,
          label: r === 'system' ? t('system') : tRoles(r),
        })),
      ]),
    [t, tRoles]
  );

  const sharedFilters: AuditLogListParams = {
    perPage: PER_PAGE,
    sort: '-createdAt',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(actorRole ? { actorRole } : {}),
    ...(from ? { from: new Date(from).toISOString() } : {}),
    ...(to ? { to: new Date(to).toISOString() } : {}),
  };

  // Both queries stay enabled regardless of the active tab so the
  // tab counters reflect the live totals for each category.
  const accessQuery = useQuery({
    queryKey: ['auditLogs', 'access', accessPage, sharedFilters],
    queryFn: () =>
      getAuditLogs({ ...sharedFilters, category: 'access', page: accessPage }),
    placeholderData: keepPreviousData,
  });

  const changesQuery = useQuery({
    queryKey: ['auditLogs', 'changes', changesPage, sharedFilters],
    queryFn: () =>
      getAuditLogs({
        ...sharedFilters,
        category: 'changes',
        page: changesPage,
      }),
    placeholderData: keepPreviousData,
  });

  const onClearFilters = () => {
    setSearch('');
    setActorRole('');
    setFrom('');
    setTo('');
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
      id: 'role',
      type: 'select',
      label: t('filters.role'),
      value: roleMapper.getLabelByValue(actorRole) ?? t('filters.allRoles'),
      options: roleMapper.labelsArray,
      onSelect: (label) =>
        setActorRole(
          (roleMapper.getValueByLabel(label) ?? '') as AuditActorRole | ''
        ),
    },
    {
      id: 'from',
      type: 'date',
      label: t('filters.from'),
      value: from,
      onChange: setFrom,
      placeholder: t('filters.datePlaceholder'),
    },
    {
      id: 'to',
      type: 'date',
      label: t('filters.to'),
      value: to,
      onChange: setTo,
      placeholder: t('filters.datePlaceholder'),
    },
  ];

  const tabs: TabItem<AuditTab>[] = [
    { value: 'access', label: t('sections.access.title') },
    { value: 'changes', label: t('sections.changes.title') },
  ];

  const counts: Partial<Record<AuditTab, number>> = {
    access: accessQuery.data?.total ?? 0,
    changes: changesQuery.data?.total ?? 0,
  };

  const activeQuery = activeTab === 'access' ? accessQuery : changesQuery;
  const activePage = activeTab === 'access' ? accessPage : changesPage;
  const setActivePage =
    activeTab === 'access' ? setAccessPage : setChangesPage;
  const emptyText =
    activeTab === 'access'
      ? t('sections.access.empty')
      : t('sections.changes.empty');

  return (
    <section className="admin_section">
      <div className={css.pageHeader}>
        <h1 className="title">{t('title')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
      </div>

      {/* Shared filters (universal Filters component) — search by
          actor name, role select, date range. Applies to both tabs. */}
      <div className={css.filtersWrap}>
        <Filters items={filterItems} onClear={onClearFilters} />
      </div>

      {/* ── Tabs: Accessi / Modifiche ──────────────────────────── */}
      <div className={css.tabsBar}>
        <Tabs<AuditTab>
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
        />
      </div>

      {activeQuery.isLoading ? (
        <div className={css.sectionLoader}>
          <Loader />
        </div>
      ) : activeQuery.isError ? (
        <NoFound
          title={tNoFound('serverErrorTitle')}
          message={tNoFound('serverErrorMessage')}
        />
      ) : (activeQuery.data?.items.length ?? 0) === 0 ? (
        <p className={css.empty}>{emptyText}</p>
      ) : (
        <>
          <LogsAuditList
            entries={activeQuery.data?.items ?? []}
            variant={activeTab}
            onEntryClick={setOpenEntry}
          />
          {(activeQuery.data?.totalPages ?? 0) > 1 && (
            <div className={css.paginationWrap}>
              <Pagination
                totalPages={activeQuery.data?.totalPages ?? 0}
                page={activePage}
                onPageChange={setActivePage}
              />
            </div>
          )}
        </>
      )}

      <p className={css.footerNote}>
        <strong className={css.footerNoteStrong}>{t('footer.label')}:</strong>{' '}
        {t('footer.body')}
      </p>

      {openEntry && (
        <LogAuditDetailModal
          entry={openEntry}
          onClose={() => setOpenEntry(null)}
        />
      )}
    </section>
  );
};

export default AdminLogsAuditClientPage;
