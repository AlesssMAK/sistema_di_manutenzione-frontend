'use client';

import { use, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { fetchFaultById } from '@/lib/api/faults';
import { FaultCard } from '@/types/faultType';
import { useAuthStore } from '@/lib/store/authStore';
import { useSocket } from '@/providers/SocketProvider/SocketProvider';
import ImageModal from '@/components/UI/ImageModal/ImageModal';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Button from '@/components/UI/Button/Button';
import MaintenanceUpdateModal from '@/components/MaintenanceWorker/MaintenanceUpdateModal/MaintenanceUpdateModal';
import css from './page.module.css';

const priorityClass = (priority: string | undefined, styles: Record<string, string>) => {
  if (priority === 'Low') return styles.priorityLow;
  if (priority === 'Medium') return styles.priorityMedium;
  if (priority === 'High') return styles.priorityHigh;
  return '';
};

/** Map raw backend statusFault to the StatusFault i18n key. */
const statusKey = (status: string | undefined) => {
  if (status === 'In progress') return 'IN_PROGRESS';
  if (status === 'Completed') return 'COMPLETED';
  if (status === 'Suspended') return 'SUSPENDED';
  if (status === 'Overdue') return 'OVERDUE';
  return 'CREATED';
};

/** Pick the status-badge CSS class for the given raw status. */
const statusClass = (status: string | undefined, styles: Record<string, string>) => {
  if (status === 'In progress') return styles.statusInProgress;
  if (status === 'Completed') return styles.statusCompleted;
  if (status === 'Suspended') return styles.statusSuspended;
  if (status === 'Overdue') return styles.statusOverdue;
  return styles.statusCreated;
};

/** Urgency bucket for the deadline date — drives the color modifier. */
const deadlineUrgencyClass = (
  deadline: string | undefined,
  styles: Record<string, string>
) => {
  if (!deadline) return '';
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays <= 3) return styles.deadlineUrgent;
  if (diffDays <= 7) return styles.deadlineSoon;
  return styles.deadlineFar;
};

const formatDay = (value?: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'dd MMMM yyyy', { locale: it }) : value;
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed)
    ? format(parsed, 'dd MMMM yyyy HH:mm', { locale: it })
    : value;
};

export default function FaultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const t = useTranslations('FaultDetail');
  const tNoFound = useTranslations('NoFound');
  const tStatus = useTranslations('StatusFault');
  const tType = useTranslations('TypeFault');
  const tPriority = useTranslations('Priority');
  const queryClient = useQueryClient();
  const { subscribeToFault, unsubscribeFromFault } = useSocket();
  const { user } = useAuthStore();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const {
    data: fault,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['fault', id],
    queryFn: () => fetchFaultById(id),
    enabled: Boolean(id),
  });

  // Subscribe to socket events so status changes / comments / replans
  // pushed by another role land in the cache without a manual reload.
  useEffect(() => {
    if (!id) return;
    subscribeToFault(id);
    return () => unsubscribeFromFault(id);
  }, [id, subscribeToFault, unsubscribeFromFault]);

  const handleBack = () => {
    router.push('/maintenance-worker');
  };

  const handleUpdateSuccess = (updatedData: FaultCard) => {
    // Preserve the human-readable faultId (modal payload uses _id).
    queryClient.setQueryData<FaultCard | undefined>(['fault', id], prev =>
      prev ? { ...updatedData, faultId: prev.faultId } : updatedData
    );
    queryClient.invalidateQueries({ queryKey: ['faults'] });
    setIsUpdateModalOpen(false);
  };

  if (isLoading)
    return (
      <div className="container">
        <div className={css.pageWrapper}>
          <Loader />
        </div>
      </div>
    );
  if (isError || !fault)
    return (
      <div className="container">
        <div className={css.pageWrapper}>
          <NoFound
            title={tNoFound('noResultsTitle')}
            message={t('errors.interventionNotFound')}
          />
        </div>
      </div>
    );

  const isCompleted = fault.statusFault === 'Completed';
  const isSuspended = fault.statusFault === 'Suspended';
  const wasRescheduled = Boolean(fault.autoRescheduledFrom?.plannedDate);

  // Assignment scope from the current user's point of view — mirrors
  // the FaultCardsList color coding (mine / pool / other) so the
  // worker reads the same signal in list and detail. "other" gets no
  // badge — there's no useful action to surface in that case.
  const myId = user?._id ? String(user._id) : '';
  const assignedToMe =
    myId !== '' && (fault.assignedMaintainers ?? []).map(String).includes(myId);
  const isPool = (fault.assignedMaintainers?.length ?? 0) === 0;

  return (
    <div className="container">
      <div className={css.pageWrapper}>
        <div className={css.card}>
          <header className={css.header}>
            <div className={css.headerLeft}>
              <button
                type="button"
                className={css.backButton}
                onClick={handleBack}
                title={t('backButton')}
                aria-label={t('backButton')}
              >
                <svg width="20" height="20" aria-hidden="true">
                  <use href="/sprite.svg#arrow_back_ios_new" />
                </svg>
              </button>
              <h2 className={css.title}>{t('title')}</h2>
            </div>
            <div className={css.headerRight}>
              {/* Scope badge — tells the worker at a glance whether
                  this fault is theirs, sitting in the pool, or
                  belongs to someone else (no badge in that case). */}
              {assignedToMe && (
                <span
                  className={`${css.scopeBadge} ${css.scopeBadgeMine}`}
                >
                  {t('badges.assignedToMe')}
                </span>
              )}
              {!assignedToMe && isPool && (
                <span
                  className={`${css.scopeBadge} ${css.scopeBadgePool}`}
                >
                  {t('badges.pool')}
                </span>
              )}
              {wasRescheduled && (
                <span
                  className={css.rescheduledBadge}
                  title={`${t('badges.originalLabel')} ${fault.autoRescheduledFrom?.plannedDate ?? ''}${
                    fault.autoRescheduledFrom?.plannedTime
                      ? ' ' + fault.autoRescheduledFrom.plannedTime
                      : ''
                  }`}
                >
                  {t('badges.rescheduled')}
                </span>
              )}
              <span className={css.idBadge}>{fault.faultId}</span>
            </div>
          </header>

          <div className={css.infoGrid}>
            {/* Short pair on phone: operator + status badge */}
            <div className={css.infoRow}>
              <div className={css.infoItem}>
                <label>{t('labels.operator')}</label>
                <p>{fault.nameOperator}</p>
              </div>
              <div className={css.infoItem}>
                <label>{t('labels.status')}</label>
                <span className={`${css.status} ${statusClass(fault.statusFault, css)}`}>
                  {tStatus(statusKey(fault.statusFault))}
                </span>
              </div>
            </div>

            {/* Full-width on phone: dates with time are too long to split */}
            <div className={css.infoItem}>
              <label>{t('labels.dateCreated')}</label>
              <p>
                {formatDay(fault.dataCreated)}
                {fault.timeCreated ? ` · ${fault.timeCreated}` : ''}
              </p>
            </div>
            <div className={css.infoItem}>
              <label>{t('labels.lastUpdated')}</label>
              <p>{formatDateTime(fault.updatedAt)}</p>
            </div>

            {/* Full-width on phone: plant/part names with codes are
                unpredictably long */}
            <div className={css.infoItem}>
              <label>{t('labels.plant')}</label>
              <p>
                {fault.plantId?.namePlant} ({fault.plantId?.code})
              </p>
            </div>
            <div className={css.infoItem}>
              <label>{t('labels.plantPart')}</label>
              <p>
                {fault.partId?.namePlantPart} ({fault.partId?.codePlantPart})
              </p>
            </div>

            {/* Short pair on phone: type + priority */}
            <div className={css.infoRow}>
              <div className={css.infoItem}>
                <label>{t('labels.type')}</label>
                <p>
                  {tType(fault.typeFault === 'Safety' ? 'SAFETY' : 'PRODUCTION')}
                </p>
              </div>
              <div className={css.infoItem}>
                <label>{t('labels.priority')}</label>
                <p className={`${css.priority} ${priorityClass(fault.priority, css)}`}>
                  {tPriority(fault.priority)}
                </p>
              </div>
            </div>

            {/* Short pair on phone: deadline + estimated duration */}
            <div className={css.infoRow}>
              <div className={css.infoItem}>
                <label>{t('labels.deadline')}</label>
                <p
                  className={`${css.deadline} ${deadlineUrgencyClass(fault.deadline, css)}`}
                >
                  {fault.deadline
                    ? formatDay(fault.deadline)
                    : t('labels.deadlineNotSet')}
                </p>
              </div>
              <div className={css.infoItem}>
                <label>{t('labels.estimatedDuration')}</label>
                <p>{fault.estimatedDuration || 0} min</p>
              </div>
            </div>

            {/* Phase C: when the fault is completed, show the actual
                duration alongside when it was closed — gives the
                worker (and anyone auditing) the real-vs-estimate
                signal in one glance. */}
            {isCompleted && (
              <div className={css.infoRow}>
                <div className={css.infoItem}>
                  <label>{t('labels.actualDuration')}</label>
                  <p>{fault.actualDuration ? `${fault.actualDuration} min` : '—'}</p>
                </div>
                <div className={css.infoItem}>
                  <label>{t('labels.completedAt')}</label>
                  <p>{formatDateTime(fault.completedAt)}</p>
                </div>
              </div>
            )}

            {/* Phase C: when suspended, surface the reason + material
                request so whoever picks the fault back up knows
                what's needed to resume. */}
            {isSuspended && fault.suspensionReason && (
              <div className={css.infoItem}>
                <label>{t('labels.suspensionReason')}</label>
                <p>{fault.suspensionReason}</p>
              </div>
            )}
            {isSuspended && fault.materialRequest && (
              <div className={css.infoItem}>
                <label>{t('labels.materialRequest')}</label>
                <p>{fault.materialRequest}</p>
              </div>
            )}

            {/* Phase C: claim audit trail (any non-Created fault that
                has been picked up). */}
            {fault.claimedAt && (
              <div className={css.infoItem}>
                <label>{t('labels.claimedAt')}</label>
                <p>{formatDateTime(fault.claimedAt)}</p>
              </div>
            )}
          </div>

          {/* Comments — using the same i18n keys as manager/[id] +
              safety/[id] so the same field reads the same on every
              detail page. */}
          <div className={css.detailsBlock}>
            <div className={css.commentBox}>
              <label>{t('comments.operatorDescription')}</label>
              <p>{fault.comment || t('comments.noDescription')}</p>
            </div>

            <div className={css.commentBox}>
              <label>{t('comments.managerNote')}</label>
              <p>{fault.managerComment || t('comments.noNote')}</p>
            </div>

            <div className={css.commentBox}>
              <label>{t('comments.maintainerNote')}</label>
              <p>
                {fault.commentMaintenanceWorker || t('comments.noNote')}
              </p>
            </div>

            {/* Nota HSE — visibile solo per i fault Safety */}
            {fault.typeFault === 'Safety' && (
              <div className={css.commentBox}>
                <label>{t('comments.hseNote')}</label>
                <p>{fault.commentSafety || t('comments.noNote')}</p>
              </div>
            )}
          </div>

          {/* Фотографии */}
          {fault.img && fault.img.length > 0 && (
            <div className={css.imageSection}>
              <label>{t('labels.attachedPhotos')}</label>
              <div className={css.imageGrid}>
                {fault.img.map((url, index) => (
                  <div
                    key={index}
                    className={css.imageWrapper}
                    onClick={() => setSelectedImage(url)}
                  >
                    <img
                      src={url}
                      alt={`Detail ${index}`}
                      className={css.image}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Completed faults are terminal — the modal's state machine
              already blocks any transition, so don't tempt the user
              with a button that can't do anything. */}
          {!isCompleted && (
            <div className={css.actions}>
              <Button
                type="button"
                className="button button--blue"
                onClick={() => setIsUpdateModalOpen(true)}
              >
                {t('actions.addCommentAndChangeStatus')}
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Modal di aggiornamento */}
      {isUpdateModalOpen && fault && (
        <MaintenanceUpdateModal
          faultId={fault._id}
          displayId={fault.faultId}
          currentStatus={fault.statusFault}
          onClose={() => setIsUpdateModalOpen(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
