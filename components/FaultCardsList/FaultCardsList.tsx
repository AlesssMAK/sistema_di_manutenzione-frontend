'use client';

import Button from '../UI/Button/Button';
import css from './FaultCardsList.module.css';
import type { FaultCard } from '@/types/faultType';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { claimFault } from '@/lib/api/faults';
import { useState } from 'react';

interface FaultCardsListProps {
  faults: FaultCard[];
}

const FaultCardsList = ({ faults }: FaultCardsListProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('FaultCard');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  const claimMutation = useMutation({
    mutationFn: (id: string) => claimFault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
      toast.success(t('messages.claimed'));
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : t('messages.claimError');
      toast.error(message);
    },
  });

  const canClaim = (fault: FaultCard) => {
    const isClaimableStatus =
      fault.statusFault === 'Created' || fault.statusFault === 'Overdue';
    const assigned = fault.assignedMaintainers ?? [];
    const isInPool = assigned.length === 0;
    const isAssignedToMe = assigned.map(String).includes(userId);
    return isClaimableStatus && (isInPool || isAssignedToMe);
  };

  const cardScope = (fault: FaultCard): 'mine' | 'pool' | 'other' => {
    const assigned = fault.assignedMaintainers ?? [];
    if (assigned.length === 0) return 'pool';
    if (assigned.map(String).includes(userId)) return 'mine';
    return 'other';
  };

  const scopeClassName: Record<'mine' | 'pool' | 'other', string> = {
    mine: css.faultCard_mine,
    pool: css.faultCard_pool,
    other: css.faultCard_other,
  };

  const handleDetailClick = (id: string) => {
    setIsLoading(true);
    router.push(`/maintenance-worker/${id}`);
  };

  if (!faults || faults.length === 0) {
    return <div className={css.container}>{t('empty')}</div>;
  }

  return (
    <div className={css.containerFaultCardList}>
      <ul className={css.faultList}>
        {faults.map(fault => (
          <li
            key={fault._id}
            className={`${css.faultCard} ${scopeClassName[cardScope(fault)]}`}
          >
            <div className={css.content}>
              <div>
                <div className={css.header}>
                  <span className={css.faultId}>{fault.faultId}</span>
                  {fault.autoRescheduledFrom?.plannedDate && (
                    <span
                      className={css.riprogrammatBadge}
                      title={`${t('badges.originalLabel')} ${fault.autoRescheduledFrom.plannedDate}${
                        fault.autoRescheduledFrom.plannedTime
                          ? ' ' + fault.autoRescheduledFrom.plannedTime
                          : ''
                      }`}
                    >
                      {t('badges.rescheduled')}
                    </span>
                  )}
                  <div className={css.headerButton}>
                    <span
                      className={`${css.statusBadge} ${
                        css[
                          `statusBadge_${fault.statusFault.replace(' ', '')}`
                        ] ?? ''
                      }`}
                    >
                      {fault.statusFault}
                    </span>
                  </div>
                </div>

                <div className={css.details}>
                  <p className={css.namePlant}>
                    <strong>{t('labels.machine')}:</strong>{' '}
                    {fault.plantId?.namePlant}
                  </p>
                </div>
                <Button
                  type="button"
                  className="button--white"
                  width={160}
                  height={30}
                >
                  <div className={css.user}>
                    <svg className={css.user_icon} width="12" height="12">
                      <use href="/sprite.svg#user"></use>
                    </svg>
                    <p className={css.user_name}>{user?.fullName}</p>
                  </div>
                </Button>
                <div className={css.detailsGrid}>
                  {/* Colonna sinistra */}
                  <div className={css.detailItem}>
                    <span className={css.label}>{t('labels.plantPart')}</span>
                    <p className={css.value}>{fault.partId?.namePlantPart}</p>
                    <span className={css.label}>{t('labels.plannedTime')}</span>
                    <p className={css.value}>{fault.plannedTime}</p>
                    <span className={css.label}>{t('labels.deadline')}</span>
                    <p className={css.value}>{fault.deadline}</p>
                  </div>

                  {/* Colonna destra */}
                  <div className={css.detailItem}>
                    <span className={css.label}>{t('labels.priority')}</span>
                    <p className={`${css.value} ${css.priorityValue}`}>
                      {fault.priority}
                    </p>
                    <span className={css.label}>
                      {t('labels.estimatedDuration')}
                    </span>
                    <p className={css.value}>{fault.estimatedDuration}</p>
                  </div>
                </div>
              </div>

              {fault.comment && (
                <div className={css.commentContainer}>
                  <h4 className={css.commentLabel}>{t('labels.comment')}:</h4>
                  <p className={css.commentText}>{fault.comment}</p>
                </div>
              )}
            </div>
            <div className={css.shmorebtn}>
              {canClaim(fault) && (
                <Button
                  type="button"
                  className="button button--blue"
                  onClick={() => claimMutation.mutate(fault._id)}
                  disabled={claimMutation.isPending}
                >
                  {claimMutation.isPending
                    ? t('buttons.takingOver')
                    : t('buttons.takeOver')}
                </Button>
              )}
              <Button
                type="button"
                className="button button--blue"
                width={200}
                height={40}
                onClick={() => handleDetailClick(fault._id)}
                disabled={isLoading}
              >
                {isLoading ? t('buttons.loading') : t('buttons.viewDetails')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FaultCardsList;
