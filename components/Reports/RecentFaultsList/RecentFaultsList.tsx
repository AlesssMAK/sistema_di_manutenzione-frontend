'use client';

import { useTranslations } from 'next-intl';
import type { FaultCard } from '@/types/faultType';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import { FaultRowList } from '@/components/UI/FaultRow/FaultRow';
import css from './RecentFaultsList.module.css';

interface RecentFaultsListProps {
  /** Already-fetched, 30-day-windowed + filtered faults (owned by the page). */
  items: FaultCard[];
  isLoading: boolean;
  isError: boolean;
}

const RecentFaultsList = ({ items, isLoading, isError }: RecentFaultsListProps) => {
  const t = useTranslations('reportsAndCommunicationsPage');
  const tNoFound = useTranslations('NoFound');

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
        hideIcon
      />
    );
  }

  if (items.length === 0) {
    return (
      <NoFound
        title={tNoFound('emptyTitle')}
        message={t('sections.recentFaults.empty')}
        hideIcon
      />
    );
  }

  return <FaultRowList items={items} />;
};

export default RecentFaultsList;
