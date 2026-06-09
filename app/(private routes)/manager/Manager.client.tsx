'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usePageStore } from '@/lib/store/pageStore';
import { fetchFaultCards } from '@/lib/api/faults';
import { FaultCard } from '@/types/faultType';
import FaultManagerCard from '@/components/Manager/FaultManagerCard/FaultManagerCard';
import PlanFaultForm from '@/components/forms/PlanFaultForm/PlanFaultForm';
import Pagination from '@/components/UI/Pagination/Pagination';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import css from './Manager.module.css';

type ManagerTab = 'received' | 'inProgress' | 'archive';

const TAB_TO_STATUS: Record<ManagerTab, string> = {
  received: 'Created',
  inProgress: 'In progress,Suspended,Overdue',
  archive: 'Completed',
};

const PER_PAGE = 8;

const ManagerClient = () => {
  const t = useTranslations('ManagerPage');
  const tNoFound = useTranslations('NoFound');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  const TABS: TabItem<ManagerTab>[] = [
    { value: 'received', label: t('tabs.received') },
    { value: 'inProgress', label: t('tabs.inProgress') },
    { value: 'archive', label: t('tabs.archive') },
  ];

  const [activeTab, setActiveTab] = useState<ManagerTab>('received');
  const [page, setPage] = useState(1);
  const [planningFault, setPlanningFault] = useState<FaultCard | null>(null);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, [setPageTitle, t]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['faults', 'manager', activeTab, page],
    queryFn: () =>
      fetchFaultCards({
        page,
        perPage: PER_PAGE,
        statusFault: TAB_TO_STATUS[activeTab],
      }),
    placeholderData: keepPreviousData,
  });

  const handleTabChange = (tab: ManagerTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
  };

  const handlePlan = (fault: FaultCard) => {
    setPlanningFault(fault);
  };

  const faults = data?.fault ?? [];
  const totalPage = data?.totalPage ?? 0;

  return (
    <div className="container">
      <div className={css.pageWrapper}>
        <h2 className="title">{t('headerTitle')}</h2>
        <p className="subtitle">{t('headerSubtitle')}</p>

        <div className={css.tabsBarWrap}>
          <Tabs<ManagerTab>
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            counts={
              data?.totalFault !== undefined
                ? ({ [activeTab]: data.totalFault } as Partial<
                    Record<ManagerTab, number>
                  >)
                : undefined
            }
          />
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
              message={t(`empty.${activeTab}`)}
            />
          ) : (
            <ul className={css.cardList}>
              {faults.map(fault => (
                <FaultManagerCard
                  key={fault._id}
                  fault={fault}
                  onPlan={activeTab === 'archive' ? undefined : handlePlan}
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

        {planningFault && (
          <PlanFaultForm
            fault={planningFault}
            onClose={() => setPlanningFault(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ManagerClient;
