'use client';

import FaultManagerCard from '@/components/Manager/FaultManagerCard/FaultManagerCard';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import {
  fetchFaultCards,
  fetchListSeen,
  markListSeen,
} from '@/lib/api/faults';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import css from './Safety.module.css';

const PER_PAGE = 8;

const SafetyClient = () => {
  const t = useTranslations('SafetyPage');
  const tNoFound = useTranslations('NoFound');
  const tStatus = useTranslations('StatusFault');

  const STATUS_OPTIONS = [
    { label: t('statusOptions.all'), value: '' },
    { label: tStatus('CREATED'), value: 'Created' },
    { label: tStatus('IN_PROGRESS'), value: 'In progress' },
    { label: tStatus('SUSPENDED'), value: 'Suspended' },
    { label: tStatus('OVERDUE'), value: 'Overdue' },
    { label: tStatus('COMPLETED'), value: 'Completed' },
  ];

  const [statusFault, setStatusFault] = useState<string>('');
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  // Per-list lastSeen (drives model A for assigned safety faults).
  const { data: listSeen } = useQuery({
    queryKey: ['listSeen'],
    queryFn: fetchListSeen,
    staleTime: 30 * 1000,
  });
  const since = listSeen?.safety_all;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['faults', 'safety', statusFault || 'all', page, since ?? null],
    queryFn: () =>
      fetchFaultCards({
        page,
        perPage: PER_PAGE,
        typeFault: 'Safety',
        ...(statusFault ? { statusFault } : {}),
        withUnseen: true,
        ...(since ? { seenSince: since } : {}),
      }),
    placeholderData: keepPreviousData,
  });

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

  const handleStatusChange = (label: string) => {
    const option = STATUS_OPTIONS.find(o => o.label === label);
    setStatusFault(option?.value ?? '');
    setPage(1);
  };

  const selectedStatusLabel =
    STATUS_OPTIONS.find(o => o.value === statusFault)?.label ??
    STATUS_OPTIONS[0].label;

  return (
    <div className="container">
      <div className={css.page_wrapper}>
        <h2 className="title">
          {t('headerTitle')}
          <span className={css.safetyBadge}>{t('badge')}</span>
        </h2>
        <p className="subtitle">{t('headerSubtitle')}</p>

        <div className={css.toolbar}>
          <div className={css.field}>
            <label className={css.fieldLabel}>{t('statusFilter')}</label>
            <SelectDropdown
              options={STATUS_OPTIONS.map(o => o.label)}
              selectedValue={selectedStatusLabel}
              onSelect={handleStatusChange}
            />
          </div>
          {data?.hasUnseen && (
            <span className={css.newBadge}>
              <span className={css.newDot} aria-hidden="true" />
              {t('newBadge')}
            </span>
          )}
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
            <NoFound title={tNoFound('emptyTitle')} message={t('empty')} />
          ) : (
            <ul className={css.cardList}>
              {faults.map(fault => (
                <FaultManagerCard
                  key={fault._id}
                  fault={fault}
                  detailHref={f => `/safety/${f._id}`}
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
