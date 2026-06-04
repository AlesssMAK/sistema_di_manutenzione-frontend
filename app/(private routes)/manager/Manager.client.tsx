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
import css from './Manager.module.css';

type ManagerTab = 'received' | 'inProgress' | 'archive';

const TAB_TO_STATUS: Record<ManagerTab, string> = {
  received: 'Created',
  inProgress: 'In progress,Suspended,Overdue',
  archive: 'Completed',
};

const TAB_LABELS: Record<ManagerTab, string> = {
  received: 'Ricevute',
  inProgress: 'In lavorazione',
  archive: 'Registro completate',
};

const PER_PAGE = 8;

const ManagerClient = () => {
  const t = useTranslations('ManagerPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

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
        <h2 className="title">Pannello Responsabile</h2>
        <p className="subtitle">
          Gestisci le segnalazioni ricevute, le attività in corso e
          l&apos;archivio
        </p>

        <div className={css.tabsBar}>
          {(Object.keys(TAB_LABELS) as ManagerTab[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`${css.tabButton} ${
                activeTab === tab ? css.tabActive : ''
              }`}
            >
              {TAB_LABELS[tab]}
              {activeTab === tab && data?.totalFault !== undefined && (
                <span className={css.tabCount}>{data.totalFault}</span>
              )}
            </button>
          ))}
        </div>

        <div className={css.contentSection}>
          {isLoading ? (
            <p className={css.loadingText}>Caricamento...</p>
          ) : isError ? (
            <p className={css.emptyText}>
              Errore durante il caricamento delle segnalazioni
            </p>
          ) : faults.length === 0 ? (
            <p className={css.emptyText}>
              {activeTab === 'received' && 'Nessuna segnalazione in attesa'}
              {activeTab === 'inProgress' &&
                'Nessuna segnalazione in lavorazione'}
              {activeTab === 'archive' && 'Nessuna segnalazione archiviata'}
            </p>
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
