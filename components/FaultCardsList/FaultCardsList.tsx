'use client';

import { format, isValid, parseISO } from 'date-fns';
import Button from '../UI/Button/Button';
import FaultIdBadge from '@/components/UI/FaultIdBadge/FaultIdBadge';
import PriorityBadge from '@/components/UI/PriorityBadge/PriorityBadge';
import css from './FaultCardsList.module.css';
import type { AssignedMaintainer, FaultCard } from '@/types/faultType';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import { formatDuration } from '@/lib/utils/faultTime';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  claimFault,
  getAlreadyWorkingFault,
  type ActiveWorkFault,
} from '@/lib/api/faults';
import AlreadyWorkingModal from '@/components/MaintenanceWorker/AlreadyWorkingModal/AlreadyWorkingModal';
import { isInPeriod, type Period } from '@/lib/utils/period';
import { useState } from 'react';

/** Map raw backend statusFault to the StatusFault i18n key. */
const statusKey = (status: string | undefined) => {
  if (status === 'In progress') return 'IN_PROGRESS';
  if (status === 'Completed') return 'COMPLETED';
  if (status === 'Suspended') return 'SUSPENDED';
  if (status === 'Overdue') return 'OVERDUE';
  return 'CREATED';
};

const formatDay = (
  value: string | undefined,
  locale: ReturnType<typeof getDateFnsLocale>
) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'dd MMM yyyy', { locale }) : value;
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

/** Priority → card perimeter-border colour (same canonical palette).
 *  The scope modifier keeps the 4px left strip; this tints the rest. */
const cardPriorityClass: Record<string, string> = {
  Low: css.cardPriorityLow,
  Medium: css.cardPriorityMedium,
  High: css.cardPriorityHigh,
};

interface FaultCardsListProps {
  faults: FaultCard[];
  /** Called with the server's updated fault after a successful claim so
   *  the owner of the list (which manages `faults` itself) can refresh
   *  the card in place. Without it the claimed card stays stale until a
   *  full page reload. */
  onClaimed?: (updated: FaultCard) => void;
  /** Active "Periodo" filter — the matched date value gets highlighted. */
  period?: Period;
}

const FaultCardsList = ({ faults, onClaimed, period }: FaultCardsListProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('FaultCard');
  const tStatus = useTranslations('StatusFault');
  const tDur = useTranslations('Duration');
  const locale = getDateFnsLocale(useLocale());
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  // When a claim is blocked because the technician is already working on
  // another fault, we stash that fault (to show the modal) plus the id they
  // wanted to claim (to auto-start once the current one is freed).
  const [blockedActive, setBlockedActive] = useState<ActiveWorkFault | null>(
    null
  );
  const [pendingClaimId, setPendingClaimId] = useState<string | null>(null);

  const claimMutation = useMutation({
    mutationFn: (id: string) => claimFault(id),
    onSuccess: updated => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
      toast.success(t('messages.claimed'));
      // The maintenance-worker list owns its data in local state (not a
      // React Query cache), so invalidateQueries above is a no-op there.
      // Hand the fresh fault back so the owner can update the card.
      onClaimed?.(updated);
    },
    onError: (err: unknown, id) => {
      // Already working on another fault → show the finalize/suspend/continue
      // modal instead of a generic error, and remember what to start next.
      const active = getAlreadyWorkingFault(err);
      if (active) {
        setPendingClaimId(id);
        setBlockedActive(active);
        return;
      }
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
              ? (user?.fullName ?? '')
              : scope === 'pool'
                ? t('labels.pool')
                : allPopulated
                  ? populatedNames.join(', ')
                  : t('maintainerCount', { count: assigned.length });
          const assigneeIcon = scope === 'mine' ? 'user' : 'users';
          // For my faults, tell apart the ones I actively took into work
          // (claimed → In progress) from the ones merely assigned to me and
          // still waiting to be started.
          const inWork = String(fault.claimedBy ?? '') === userId;

          // Current pause info (shown on the card while the fault is
          // Suspended): date + reason of the latest suspension.
          const isSuspended = fault.statusFault === 'Suspended';
          // A closed fault only keeps its status badge — the assignment /
          // rescheduled pills are noise once it's done.
          const isCompleted = fault.statusFault === 'Completed';
          const lastSusp = fault.suspensions?.length
            ? fault.suspensions[fault.suspensions.length - 1]
            : null;
          const suspReason = lastSusp?.reason || fault.suspensionReason;
          const suspDate = formatDay(
            lastSusp?.suspendedAt ?? fault.updatedAt,
            locale
          );

          return (
            <li
              key={fault._id}
              className={`${css.faultCard} ${
                cardPriorityClass[fault.priority] ?? ''
              }`}
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
                    <FaultIdBadge id={fault.faultId} />
                    {fault.unseen && (
                      <span
                        className={css.unseenBadge}
                        title={t('badges.unseen')}
                      >
                        <span
                          className={css.unseenDot}
                          aria-hidden="true"
                        />
                        {t('badges.unseen')}
                      </span>
                    )}
                    {!isCompleted && fault.autoRescheduledFrom?.plannedDate && (
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
                      {scope === 'mine' && !isCompleted && (
                        <span
                          className={`${css.assignBadge} ${
                            inWork ? css.assignBadgeWork : css.assignBadgeIdle
                          }`}
                        >
                          {inWork
                            ? t('badges.takenOver')
                            : t('badges.assigned')}
                        </span>
                      )}
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
                      <span className={css.label}>
                        {t('labels.plannedTime')}
                      </span>
                      <p className={css.value}>{fault.plannedTime}</p>
                      <span className={css.label}>{t('labels.deadline')}</span>
                      <p
                        className={`${css.value} ${
                          isInPeriod(fault.deadline, period)
                            ? css.periodMatch
                            : ''
                        }`}
                      >
                        {formatDay(fault.deadline, locale)}
                      </p>
                      {fault.statusFault === 'Completed' &&
                        fault.completedAt && (
                          <>
                            <span className={css.label}>
                              {t('labels.completedAt')}
                            </span>
                            <p
                              className={`${css.value} ${
                                isInPeriod(fault.completedAt, period)
                                  ? css.periodMatch
                                  : ''
                              }`}
                            >
                              {formatDay(fault.completedAt, locale)}
                            </p>
                          </>
                        )}
                    </div>

                    {/* Colonna destra */}
                    <div className={css.detailItem}>
                      <span className={css.label}>{t('labels.priority')}</span>
                      <PriorityBadge
                        priority={fault.priority}
                        className={css.priorityGap}
                      />
                      <span className={css.label}>
                        {t('labels.estimatedDuration')}
                      </span>
                      <p className={css.value}>
                        {fault.estimatedDuration
                          ? formatDuration(fault.estimatedDuration, {
                              d: tDur('d'),
                              h: tDur('h'),
                              m: tDur('m'),
                            })
                          : '—'}
                      </p>
                      <span className={css.label}>
                        {t('labels.dateCreated')}
                      </span>
                      <p
                        className={`${css.value} ${
                          isInPeriod(fault.dataCreated, period)
                            ? css.periodMatch
                            : ''
                        }`}
                      >
                        {formatDay(fault.dataCreated, locale)}
                        {fault.timeCreated ? ` ${fault.timeCreated}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {fault.comment && (
                  <div className={`${css.commentContainer} ${css.operatorNote}`}>
                    <h4 className={css.commentLabel}>{t('labels.comment')}:</h4>
                    <p className={css.commentText}>{fault.comment}</p>
                  </div>
                )}

                {isSuspended && suspReason && (
                  <div className={css.suspensionContainer}>
                    <div className={css.suspensionHead}>
                      <h4 className={css.suspensionLabel}>
                        {t('labels.suspendedOn')}
                      </h4>
                      <span className={css.suspensionDate}>{suspDate}</span>
                    </div>
                    <p className={css.suspensionText}>{suspReason}</p>
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

      {blockedActive && (
        <AlreadyWorkingModal
          active={blockedActive}
          onResolved={() => {
            const next = pendingClaimId;
            setBlockedActive(null);
            setPendingClaimId(null);
            // The active fault is now finalized/suspended — start the one
            // the technician originally wanted.
            if (next) claimMutation.mutate(next);
          }}
          onClose={() => {
            setBlockedActive(null);
            setPendingClaimId(null);
          }}
        />
      )}
    </div>
  );
};

export default FaultCardsList;
