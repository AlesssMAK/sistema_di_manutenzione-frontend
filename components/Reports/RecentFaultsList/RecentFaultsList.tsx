'use client';

import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import type { FaultCard } from '@/types/faultType';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import css from './RecentFaultsList.module.css';

interface RecentFaultsListProps {
  /** Already-fetched, 30-day-windowed + filtered faults (owned by the page). */
  items: FaultCard[];
  isLoading: boolean;
  isError: boolean;
}

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

const statusKey = (s: string) => {
  if (s === 'In progress') return 'IN_PROGRESS';
  if (s === 'Completed') return 'COMPLETED';
  if (s === 'Suspended') return 'SUSPENDED';
  if (s === 'Overdue') return 'OVERDUE';
  return 'CREATED';
};

const RecentFaultsList = ({ items, isLoading, isError }: RecentFaultsListProps) => {
  const t = useTranslations('reportsAndCommunicationsPage');
  const tNoFound = useTranslations('NoFound');
  const tStatus = useTranslations('StatusFault');

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

  if (items.length === 0) {
    return (
      <NoFound
        title={tNoFound('noResultsTitle')}
        message={t('sections.recentFaults.empty')}
      />
    );
  }

  return (
    <ul className={css.list}>
      {items.map(fault => (
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
