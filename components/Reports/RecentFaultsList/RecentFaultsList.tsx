'use client';

import { useMemo } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { fetchFaultCards } from '@/lib/api/faults';
import type { FaultCard } from '@/types/faultType';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import css from './RecentFaultsList.module.css';

// Generous cap so a single fetch usually covers a month of activity at
// realistic plant volume (a few faults per day). Backend caps perPage at
// 200; if a plant ever exceeds this in 30d we'll need a date-range filter
// on GET /faults (already on the BE backlog).
const PER_PAGE = 100;

const formatDay = (value?: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'dd MMM yyyy', { locale: it }) : value;
};

const statusClass: Record<string, string> = {
  Created: css.statusCreated,
  'In progress': css.statusInProgress,
  Suspended: css.statusSuspended,
  Overdue: css.statusOverdue,
  Completed: css.statusCompleted,
};

const RecentFaultsList = () => {
  const t = useTranslations('reportsAndCommunicationsPage');
  const tNoFound = useTranslations('NoFound');
  const tStatus = useTranslations('StatusFault');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['faults', 'recent-30d'],
    queryFn: () => fetchFaultCards({ page: 1, perPage: PER_PAGE }),
    placeholderData: keepPreviousData,
  });

  // dataCreated is YYYY-MM-DD; lexicographic compare matches chronological.
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const recent: FaultCard[] = useMemo(() => {
    const list = data?.fault ?? [];
    return list.filter(f => (f.dataCreated ?? '') >= cutoff);
  }, [data?.fault, cutoff]);

  if (isLoading) {
    return (
      <div className={css.loadingWrap}>
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <NoFound
        title={tNoFound('serverErrorTitle')}
        message={t('errors.loadFaults')}
      />
    );
  }

  if (recent.length === 0) {
    return (
      <NoFound
        title={tNoFound('noResultsTitle')}
        message={t('sections.recentFaults.empty')}
      />
    );
  }

  const statusKey = (s: string) => {
    if (s === 'Created') return 'CREATED';
    if (s === 'In progress') return 'IN_PROGRESS';
    if (s === 'Completed') return 'COMPLETED';
    if (s === 'Suspended') return 'SUSPENDED';
    if (s === 'Overdue') return 'OVERDUE';
    return 'CREATED';
  };

  return (
    <ul className={css.list}>
      {recent.map(fault => (
        <li key={fault._id} className={css.row}>
          <div className={css.head_container}>
            <div className={css.item_id}>
              <h3 className={css.title}>{t('sections.recentFaults.labels.id')}</h3>
              <p className={css.faultId}>{fault.faultId}</p>
            </div>
            <div className={css.item_date}>
              <h3 className={css.title}>{t('sections.recentFaults.labels.date')}</h3>
              <p className={css.date}>{formatDay(fault.dataCreated)}</p>
            </div>
          </div>

          <div className={css.item_plant}>
            <h3 className={css.title}>{t('sections.recentFaults.labels.plant')}</h3>
            <p className={css.plant}>
              {fault.plantId?.namePlant ?? '—'}{' '}
              <span className={css.plantPart}>
                · {fault.partId?.namePlantPart ?? '—'}
              </span>
            </p>
          </div>

          <div className={css.item_status}>
            <h3 className={css.title}>{t('sections.recentFaults.labels.status')}</h3>
            <span
              className={`${css.status} ${statusClass[fault.statusFault] ?? ''}`}
            >
              {tStatus(statusKey(fault.statusFault))}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default RecentFaultsList;
