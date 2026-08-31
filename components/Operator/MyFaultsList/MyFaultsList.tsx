'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { fetchFaultCards } from '@/lib/api/faults';
import type { FaultCard } from '@/types/faultType';
import { useAuthStore } from '@/lib/store/authStore';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import Pagination from '@/components/UI/Pagination/Pagination';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import { FaultRowList } from '@/components/UI/FaultRow/FaultRow';
import css from './MyFaultsList.module.css';

type Period = '7d' | '30d' | '3m' | 'all';

const PER_PAGE = 20;

const cutoffFor = (period: Period): string | null => {
  if (period === 'all') return null;
  const d = new Date();
  if (period === '7d') d.setDate(d.getDate() - 7);
  else if (period === '30d') d.setDate(d.getDate() - 30);
  else if (period === '3m') d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
};

const MyFaultsList = () => {
  const t = useTranslations('OperatorPage.myFaults');
  const tNoFound = useTranslations('NoFound');

  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  const [period, setPeriod] = useState<Period>('30d');
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

  // We can't push period into the backend query yet (no date-range filter
  // on GET /faults). Strategy: fetch a generous page filtered server-side
  // by createdById, then client-side filter by cutoff date.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['faults', 'my', userId, page],
    queryFn: () =>
      fetchFaultCards({
        page,
        perPage: PER_PAGE,
        createdById: userId,
      }),
    placeholderData: keepPreviousData,
    enabled: Boolean(userId),
  });

  const cutoff = cutoffFor(period);

  const items: FaultCard[] = useMemo(() => {
    const list = data?.fault ?? [];
    if (!cutoff) return list;
    return list.filter(f => (f.dataCreated ?? '') >= cutoff);
  }, [data?.fault, cutoff]);

  const totalPages = data?.totalPage ?? 0;

  const selectedLabel =
    periodOptions.find(o => o.value === period)?.label ?? periodOptions[1].label;

  const handlePeriodChange = (label: string) => {
    const opt = periodOptions.find(o => o.label === label);
    if (opt) {
      setPeriod(opt.value);
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
