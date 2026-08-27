'use client';

import MaintenanceUpdateModal from '@/components/MaintenanceWorker/MaintenanceUpdateModal/MaintenanceUpdateModal';
import OvertimeAlertModal from '@/components/MaintenanceWorker/OvertimeAlertModal/OvertimeAlertModal';
import FaultMaterialsUsed from '@/components/Warehouse/FaultMaterialsUsed/FaultMaterialsUsed';
import FaultIdBadge from '@/components/UI/FaultIdBadge/FaultIdBadge';
import { ALLOWED_TRANSITIONS } from '@/lib/validation/maintenanceWorkerUpdateValidation';
import Button from '@/components/UI/Button/Button';
import ImageModal from '@/components/UI/ImageModal/ImageModal';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import { fetchFaultById, updateFaultByWorker } from '@/lib/api/faults';
import { fetchSystemSettings } from '@/lib/api/systemSettings';
import { useAuthStore } from '@/lib/store/authStore';
import { useSocket } from '@/providers/SocketProvider/SocketProvider';
import { FaultCard } from '@/types/faultType';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import { formatDuration, liveWorkedMinutes } from '@/lib/utils/faultTime';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import css from './page.module.css';

const priorityClass = (
  priority: string | undefined,
  styles: Record<string, string>
) => {
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
const statusClass = (
  status: string | undefined,
  styles: Record<string, string>
) => {
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

const formatDay = (
  value: string | undefined,
  locale: ReturnType<typeof getDateFnsLocale>
) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed)
    ? format(parsed, 'dd MMMM yyyy', { locale })
    : value;
};

const formatDateTime = (
  value: string | undefined,
  locale: ReturnType<typeof getDateFnsLocale>
) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed)
    ? format(parsed, 'dd MMMM yyyy HH:mm', { locale })
    : value;
};

export default function FaultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const t = useTranslations('FaultDetail');
  const tDur = useTranslations('Duration');
  const tNoFound = useTranslations('NoFound');
  const tStatus = useTranslations('StatusFault');
  const tType = useTranslations('TypeFault');
  const tPriority = useTranslations('Priority');
  const locale = getDateFnsLocale(useLocale());
  const queryClient = useQueryClient();
  const { subscribeToFault, unsubscribeFromFault } = useSocket();
  const { user } = useAuthStore();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // Which transition the update modal is opened for (null = closed). Each
  // action button locks the modal to its target status.
  const [modalStatus, setModalStatus] = useState<string | null>(null);
  // Overtime alert: dismissed for this visit, plus a 1-minute ticker so
  // the running work time is re-evaluated while the page stays open.
  const [overtimeDismissed, setOvertimeDismissed] = useState(false);
  const [, setNowTick] = useState(0);

  const { data: settings } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: fetchSystemSettings,
    staleTime: 60 * 60 * 1000,
  });

  const {
    data: fault,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['fault', id],
    queryFn: () => fetchFaultById(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const timer = setInterval(() => setNowTick(n => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);

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
    setModalStatus(null);
  };

  // "Keep working" from the overtime alert: optionally log a comment,
  // then dismiss the alert for the rest of this visit.
  const continueMutation = useMutation({
    mutationFn: (comment: string) =>
      updateFaultByWorker({
        faultId: id,
        statusFault: 'In progress',
        commentMaintenanceWorker: comment,
      }),
    onSuccess: data => {
      handleUpdateSuccess(data);
      setOvertimeDismissed(true);
    },
    onError: () => setOvertimeDismissed(true),
  });

  const handleOvertimeContinue = (comment?: string) => {
    if (comment) continueMutation.mutate(comment);
    else setOvertimeDismissed(true);
  };

  if (isLoading)
    return (
      <div className="container">
        <div className={css.page_wrapper}>
          <Loader />
        </div>
      </div>
    );
  if (isError || !fault)
    return (
      <div className="container">
        <div className={css.page_wrapper}>
          <NoFound
            title={t('errors.interventionNotFoundTitle')}
            message={t('errors.interventionNotFound')}
          />
        </div>
      </div>
    );

  const isCompleted = fault.statusFault === 'Completed';
  const isSuspended = fault.statusFault === 'Suspended';
  const wasRescheduled = Boolean(fault.autoRescheduledFrom?.plannedDate);

  // In-app overtime alert: fault still In progress and worked time is
  // past the planned duration by the configured threshold.
  const overtimeHours = settings?.maintenance?.overtimeAlertHours ?? 0;
  const plannedMinutes = fault.estimatedDuration ?? 0;
  const workedMinutes = liveWorkedMinutes(fault);
  const showOvertime =
    overtimeHours > 0 &&
    fault.statusFault === 'In progress' &&
    workedMinutes > plannedMinutes + overtimeHours * 60 &&
    !overtimeDismissed &&
    !modalStatus;

  // Action buttons are driven by the same state machine the backend
  // enforces: Finalizza (→Completed), Sospendi (→Suspended) and
  // Riprendi (→In progress) each appear only when that transition is
  // allowed from the current status.
  const allowedTransitions = ALLOWED_TRANSITIONS[fault.statusFault] ?? [];
  const canFinalize = allowedTransitions.includes('Completed');
  const canSuspend = allowedTransitions.includes('Suspended');
  const canResume = allowedTransitions.includes('In progress');

  // Assignment scope from the current user's point of view — mirrors
  // the FaultCardsList color coding (mine / pool / other) so the
  // worker reads the same signal in list and detail. "other" gets no
  // badge — there's no useful action to surface in that case.
  const myId = user?._id ? String(user._id) : '';
  // assignedMaintainers arrives populated ({ _id, fullName, email }) from
  // getFaultById, so normalize to the id (a bare String() cast on the
  // object would yield "[object Object]" and never match).
  const assignedIds = (fault.assignedMaintainers ?? []).map(m =>
    typeof m === 'string' ? m : m._id
  );
  const assignedToMe = myId !== '' && assignedIds.includes(myId);
  const isPool = (fault.assignedMaintainers?.length ?? 0) === 0;
  // Finalizza/Sospendi/Riprendi are only for the worker's own fault —
  // never one assigned to other colleagues (the backend enforces the
  // same: it 403s a status change from a non-assignee). Admins bypass.
  const canAct = assignedToMe || user?.role === 'admin';

  return (
    <div className="container">
      <div className={css.page_wrapper}>
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
                <span className={`${css.scopeBadge} ${css.scopeBadgeMine}`}>
                  {t('badges.assignedToMe')}
                </span>
              )}
              {!assignedToMe && isPool && (
                <span className={`${css.scopeBadge} ${css.scopeBadgePool}`}>
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
              <FaultIdBadge id={fault.faultId} />
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
                <span
                  className={`${css.status} ${statusClass(fault.statusFault, css)}`}
                >
                  {tStatus(statusKey(fault.statusFault))}
                </span>
              </div>
            </div>

            {/* Full-width on phone: dates with time are too long to split */}
            <div className={css.infoItem}>
              <label>{t('labels.dateCreated')}</label>
              <p>
                {formatDay(fault.dataCreated, locale)}
                {fault.timeCreated ? ` · ${fault.timeCreated}` : ''}
              </p>
            </div>
            <div className={css.infoItem}>
              <label>{t('labels.lastUpdated')}</label>
              <p>{formatDateTime(fault.updatedAt, locale)}</p>
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
                  {tType(
                    fault.typeFault === 'Safety' ? 'SAFETY' : 'PRODUCTION'
                  )}
                </p>
              </div>
              <div className={css.infoItem}>
                <label>{t('labels.priority')}</label>
                <p
                  className={`${css.priority} ${priorityClass(fault.priority, css)}`}
                >
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
                    ? formatDay(fault.deadline, locale)
                    : t('labels.deadlineNotSet')}
                </p>
              </div>
              <div className={css.infoItem}>
                <label>{t('labels.estimatedDuration')}</label>
                <p>
                  {formatDuration(fault.estimatedDuration || 0, {
                    d: tDur('d'),
                    h: tDur('h'),
                    m: tDur('m'),
                  })}
                </p>
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
                  <p>
                    {fault.actualDuration
                      ? formatDuration(fault.actualDuration, {
                          d: tDur('d'),
                          h: tDur('h'),
                          m: tDur('m'),
                        })
                      : '—'}
                  </p>
                </div>
                <div className={css.infoItem}>
                  <label>{t('labels.completedAt')}</label>
                  <p>{formatDateTime(fault.completedAt, locale)}</p>
                </div>
              </div>
            )}

            {/* Phase C: when suspended, surface the reason so whoever
                picks the fault back up knows why it stalled. The material
                note itself now lives in the materials panel below. */}
            {isSuspended && fault.suspensionReason && (
              <div className={css.infoItem}>
                <label>{t('labels.suspensionReason')}</label>
                <p>{fault.suspensionReason}</p>
              </div>
            )}

            {/* Materials issued + the free-text material note (completion
                or suspension), collapsed into one panel. */}
            <FaultMaterialsUsed
              faultId={fault._id}
              materialComment={fault.materialRequest}
            />

            {/* Phase C: claim audit trail (any non-Created fault that
                has been picked up). */}
            {fault.claimedAt && (
              <div className={css.infoItem}>
                <label>{t('labels.claimedAt')}</label>
                <p>{formatDateTime(fault.claimedAt, locale)}</p>
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
              <p>{fault.commentMaintenanceWorker || t('comments.noNote')}</p>
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
          {/* One dedicated button per allowed transition. Completed and
              Created expose none (terminal / needs claim first). */}
          {canAct && (canFinalize || canSuspend || canResume) && (
            <div className={css.actions}>
              {canFinalize && (
                <Button
                  type="button"
                  className="button button--blue"
                  onClick={() => setModalStatus('Completed')}
                >
                  {t('actions.finalize')}
                </Button>
              )}
              {canSuspend && (
                <Button
                  type="button"
                  className="button button--white"
                  onClick={() => setModalStatus('Suspended')}
                >
                  {t('actions.suspend')}
                </Button>
              )}
              {canResume && (
                <Button
                  type="button"
                  className="button button--white"
                  onClick={() => setModalStatus('In progress')}
                >
                  {t('actions.resume')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Modal di aggiornamento */}
      {modalStatus && fault && (
        <MaintenanceUpdateModal
          faultId={fault._id}
          displayId={fault.faultId}
          currentStatus={fault.statusFault}
          lockedStatus={modalStatus}
          defaultActualDuration={liveWorkedMinutes(fault)}
          onClose={() => setModalStatus(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {showOvertime && (
        <OvertimeAlertModal
          displayId={fault.faultId}
          workedMinutes={workedMinutes}
          plannedMinutes={plannedMinutes}
          onComplete={() => {
            setOvertimeDismissed(true);
            setModalStatus('Completed');
          }}
          onSuspend={() => {
            setOvertimeDismissed(true);
            setModalStatus('Suspended');
          }}
          onContinue={handleOvertimeContinue}
          onClose={() => setOvertimeDismissed(true)}
          isSaving={continueMutation.isPending}
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
