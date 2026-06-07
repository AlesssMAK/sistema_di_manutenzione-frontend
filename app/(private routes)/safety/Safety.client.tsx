'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usePageStore } from '@/lib/store/pageStore';
import { fetchFaultCards } from '@/lib/api/faults';
import FaultManagerCard from '@/components/Manager/FaultManagerCard/FaultManagerCard';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import Pagination from '@/components/UI/Pagination/Pagination';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import css from './Safety.module.css';

const PER_PAGE = 8;

const SafetyClient = () => {
  const t = useTranslations('SafetyPage');
  const tNoFound = useTranslations('NoFound');
  const tStatus = useTranslations('StatusFault');
  const setPageTitle = usePageStore(state => state.setPageTitle);

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

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, [setPageTitle, t]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['faults', 'safety', statusFault || 'all', page],
    queryFn: () =>
      fetchFaultCards({
        page,
        perPage: PER_PAGE,
        typeFault: 'Safety',
        ...(statusFault ? { statusFault } : {}),
      }),
    placeholderData: keepPreviousData,
  });

  const faults = data?.fault ?? [];
  const totalPage = data?.totalPage ?? 0;

  const handleStatusChange = (label: string) => {
    const option = STATUS_OPTIONS.find(o => o.label === label);
    setStatusFault(option?.value ?? '');
    setPage(1);
  };

  const selectedStatusLabel =
    STATUS_OPTIONS.find(o => o.value === statusFault)?.label ?? STATUS_OPTIONS[0].label;

  return (
    <div className="container">
      <div className={css.pageWrapper}>
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
              message={t('empty')}
            />
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
