'use client';

import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import Button from '../UI/Button/Button';
import css from './FaultCardsList.module.css';
import type { AssignedMaintainer, FaultCard } from '@/types/faultType';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { claimFault } from '@/lib/api/faults';
import { useState } from 'react';

/** Map raw backend statusFault to the StatusFault i18n key. */
const statusKey = (status: string | undefined) => {
  if (status === 'In progress') return 'IN_PROGRESS';
  if (status === 'Completed') return 'COMPLETED';
  if (status === 'Suspended') return 'SUSPENDED';
  if (status === 'Overdue') return 'OVERDUE';
  return 'CREATED';
};

const formatDay = (value?: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'dd MMM yyyy', { locale: it }) : value;
};

/**
 * Backend `Fault.assignedMaintainers` is now populated with
 * `{ _id, fullName, email }` objects (since `f9d9de1`), but older
 * list responses or seeded fixtures may still ship raw id strings.
 * These helpers smooth over both shapes:
 *   - toId(m)   → identifier (for membership checks)
 *   - toName(m) → display name when populated, else null
 */
const toId = (m: AssignedMaintainer): string =>
  typeof m === 'string' ? m : m._id;

const toName = (m: AssignedMaintainer): string | null =>
  typeof m === 'object' && m !== null && 'fullName' in m ? m.fullName : null;

interface FaultCardsListProps {
  faults: FaultCard[];
}

const FaultCardsList = ({ faults }: FaultCardsListProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('FaultCard');
  const tStatus = useTranslations('StatusFault');
  const tPriority = useTranslations('Priority');
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
    const isAssignedToMe = assigned.map(toId).includes(userId);
    return isClaimableStatus && (isInPool || isAssignedToMe);
  };

  const cardScope = (fault: FaultCard): 'mine' | 'pool' | 'other' => {
    const assigned = fault.assignedMaintainers ?? [];
    if (assigned.length === 0) return 'pool';
    if (assigned.map(toId).includes(userId)) return 'mine';
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
        {faults.map(fault => {
          const scope = cardScope(fault);
          const assigned = fault.assignedMaintainers ?? [];
          // For "other" scope, prefer the populated full names that
          // the backend has been shipping since `f9d9de1`. If the
          // payload ever falls back to raw id strings (e.g. an older
          // endpoint that doesn't populate), drop to the plural
          // maintainerCount fallback so the pill never shows ids.
          const populatedNames = assigned
            .map(toName)
            .filter((n): n is string => Boolean(n));
          const allPopulated =
            assigned.length > 0 && populatedNames.length === assigned.length;
          const assigneeLabel =
            scope === 'mine'
              ? user?.fullName ?? ''
              : scope === 'pool'
                ? t('labels.pool')
                : allPopulated
                  ? populatedNames.join(', ')
                  : t('maintainerCount', { count: assigned.length });
          const assigneeIcon = scope === 'mine' ? 'user' : 'users';

          return (
          <li
            key={fault._id}
            className={`${css.faultCard} ${scopeClassName[scope]}`}
            role="button"
            tabIndex={0}
            onClick={() => handleDetailClick(fault._id)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDetailClick(fault._id);
              }
            }}
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
                      {tStatus(statusKey(fault.statusFault))}
                    </span>
                  </div>
                </div>

                {/* Manutentore row (assignee) — takes the position
                    previously held by Macchina; Macchina moved into
                    the grid below. */}
                <div className={css.assigneeRow}>
                  <strong className={css.assigneeLabel}>
                    {t('labels.technician')}:
                  </strong>
                  <div className={css.user}>
                    <svg className={css.user_icon} width="12" height="12">
                      <use href={`/sprite.svg#${assigneeIcon}`}></use>
                    </svg>
                    <p className={css.user_name}>{assigneeLabel}</p>
                  </div>
                </div>
                <div className={css.detailsGrid}>
                  {/* Colonna sinistra */}
                  <div className={css.detailItem}>
                    <span className={css.label}>{t('labels.machine')}</span>
                    <p className={css.value}>
                      {fault.plantId?.namePlant}
                      {fault.plantId?.code ? ` (${fault.plantId.code})` : ''}
                    </p>
                    <span className={css.label}>{t('labels.plantPart')}</span>
                    <p className={css.value}>{fault.partId?.namePlantPart}</p>
                    <span className={css.label}>{t('labels.plannedTime')}</span>
                    <p className={css.value}>{fault.plannedTime}</p>
                    <span className={css.label}>{t('labels.deadline')}</span>
                    <p className={css.value}>{formatDay(fault.deadline)}</p>
                  </div>

                  {/* Colonna destra */}
                  <div className={css.detailItem}>
                    <span className={css.label}>{t('labels.priority')}</span>
                    <p className={`${css.value} ${css.priorityValue}`}>
                      {tPriority(fault.priority)}
                    </p>
                    <span className={css.label}>
                      {t('labels.estimatedDuration')}
                    </span>
                    <p className={css.value}>
                      {fault.estimatedDuration
                        ? `${fault.estimatedDuration} min`
                        : '—'}
                    </p>
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
            {/* Buttons stop click propagation so they don't double-fire
                the card-level onClick (which also navigates to the
                detail page). */}
            <div className={css.shmorebtn} onClick={e => e.stopPropagation()}>
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
          );
        })}
      </ul>
    </div>
  );
};

export default FaultCardsList;
