'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { fetchFaultCards } from '@/lib/api/faults';
import { useAuthStore } from '@/lib/store/authStore';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import Pagination from '@/components/UI/Pagination/Pagination';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import { FaultRowList } from '@/components/UI/FaultRow/FaultRow';
import { type Period, cutoffFor } from './period';
import css from './MyFaultsList.module.css';

const PER_PAGE = 20;

interface MyFaultsListProps {
  /** Controlled by the parent so the tab badge (own count) and this list
   *  share one period and always agree. */
  period: Period;
  onPeriodChange: (period: Period) => void;
}

const MyFaultsList = ({ period, onPeriodChange }: MyFaultsListProps) => {
  const t = useTranslations('OperatorPage.myFaults');
  const tNoFound = useTranslations('NoFound');

  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  const [page, setPage] = useState(1);

  const periodOptions = useMemo(
    () => [
      { value: '7d' as Period, label: t('period.7d') },
      { value: '30d' as Period, label: t('period.30d') },
      { value: '3m' as Period, label: t('period.3m') },
      { value: 'all' as Period, label: t('period.all') },
    ],
    [t]
  );

  // Period is pushed to the backend as the `dataCreatedFrom` lower bound, so
  // the list, its pagination and the tab-badge count all reflect the same
  // filtered set (previously the period was applied client-side to a single
  // page, which desynced the badge and broke pagination totals).
  const cutoff = cutoffFor(period);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['faults', 'my', userId, page, period],
    queryFn: () =>
      fetchFaultCards({
        page,
        perPage: PER_PAGE,
        createdById: userId,
        ...(cutoff ? { dataCreatedFrom: cutoff } : {}),
      }),
    placeholderData: keepPreviousData,
    enabled: Boolean(userId),
  });

  const items = data?.fault ?? [];
  const totalPages = data?.totalPage ?? 0;

  const selectedLabel =
    periodOptions.find(o => o.value === period)?.label ?? periodOptions[1].label;

  const handlePeriodChange = (label: string) => {
    const opt = periodOptions.find(o => o.label === label);
    if (opt) {
      onPeriodChange(opt.value);
      setPage(1);
    }
  };

  return (
    <div className={css.wrap}>
      <div className={css.toolbar}>
        <div className={css.field}>
          <label className={css.fieldLabel}>{t('period.label')}</label>
          <SelectDropdown
            options={periodOptions.map(o => o.label)}
            selectedValue={selectedLabel}
            onSelect={handlePeriodChange}
          />
        </div>
      </div>

      {isLoading ? (
        <div className={css.loadingWrap}>
          <Loader />
        </div>
      ) : isError ? (
        <NoFound
          title={tNoFound('serverErrorTitle')}
          message={t('errors.load')}
          hideIcon
        />
      ) : items.length === 0 ? (
        <NoFound title={tNoFound('emptyTitle')} message={t('empty')} hideIcon />
      ) : (
        <FaultRowList items={items} />
      )}

      {totalPages > 1 && (
        <div className={css.paginationWrap}>
          <Pagination
            totalPages={totalPages}
            page={page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default MyFaultsList;
