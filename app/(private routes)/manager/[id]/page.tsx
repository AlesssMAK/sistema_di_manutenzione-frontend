'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { fetchFaultById } from '@/lib/api/faults';
import { useSocket } from '@/providers/SocketProvider/SocketProvider';
import ImageModal from '@/components/UI/ImageModal/ImageModal';
import PlanFaultForm from '@/components/forms/PlanFaultForm/PlanFaultForm';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Button from '@/components/UI/Button/Button';
import css from './page.module.css';

const formatDate = (value?: string) => {
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
  if (status === 'In progress') return styles.statusInprogress;
  if (status === 'Completed') return styles.statusCompleted;
  if (status === 'Suspended') return styles.statusSuspended;
  if (status === 'Overdue') return styles.statusOverdue;
  return styles.statusCreated;
};

const priorityClass = (
  priority: string | undefined,
  styles: Record<string, string>
) => {
  if (priority === 'Low') return styles.priorityLow;
  if (priority === 'Medium') return styles.priorityMedium;
  if (priority === 'High') return styles.priorityHigh;
  return '';
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

const ManagerFaultDetailPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const router = useRouter();
  const t = useTranslations('FaultDetail');
  const tPlan = useTranslations('PlanFaultForm');
  const tNoFound = useTranslations('NoFound');
  const tStatus = useTranslations('StatusFault');
  const tType = useTranslations('TypeFault');
  const tPriority = useTranslations('Priority');
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const { subscribeToFault, unsubscribeFromFault } = useSocket();
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    if (!id) return;
    subscribeToFault(id);
    return () => unsubscribeFromFault(id);
  }, [id, subscribeToFault, unsubscribeFromFault]);

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
            message={t('errors.faultNotFound')}
          />
        </div>
      </div>
    );

  const isReadOnly = fault.statusFault === 'Completed';

  return (
    <div className="container">
      <div className={css.pageWrapper}>
        <div className={css.card}>
        <header className={css.header}>
          <div className={css.headerLeft}>
            <button
              type="button"
              className={css.backButton}
              onClick={() => router.push('/manager')}
              title={t('backButton')}
              aria-label={t('backButton')}
            >
              <svg width="20" height="20" aria-hidden="true">
                <use href="/sprite.svg#arrow_back_ios_new" />
              </svg>
            </button>
            <h2 className={css.title}>{t('title')}</h2>
          </div>
          <span className={css.idBadge}>{fault.faultId}</span>
        </header>

        <div className={css.infoGrid}>
          <div className={css.infoItem}>
            <label>{t('labels.operator')}</label>
            <p>{fault.nameOperator || '—'}</p>
          </div>
          <div className={css.infoItem}>
            <label>{t('labels.status')}</label>
            <span className={`${css.status} ${statusClass(fault.statusFault, css)}`}>
              {tStatus(statusKey(fault.statusFault))}
            </span>
          </div>

          <div className={css.infoItem}>
            <label>{t('labels.dateCreated')}</label>
            <p>
              {formatDate(fault.dataCreated)}
              {fault.timeCreated ? ` · ${fault.timeCreated}` : ''}
            </p>
          </div>
          <div className={css.infoItem}>
            <label>{t('labels.lastUpdated')}</label>
            <p>{formatDateTime(fault.updatedAt)}</p>
          </div>

          <div className={css.infoItem}>
            <label>{t('labels.plant')}</label>
            <p>
              {fault.plantId?.namePlant ?? '—'}
              {fault.plantId?.code ? ` (${fault.plantId.code})` : ''}
            </p>
          </div>
          <div className={css.infoItem}>
            <label>{t('labels.plantPart')}</label>
            <p>
              {fault.partId?.namePlantPart ?? '—'}
              {fault.partId?.codePlantPart
                ? ` (${fault.partId.codePlantPart})`
                : ''}
            </p>
          </div>

          <div className={css.infoItem}>
            <label>{t('labels.type')}</label>
            <p>{tType(fault.typeFault === 'Safety' ? 'SAFETY' : 'PRODUCTION')}</p>
          </div>
          <div className={css.infoItem}>
            <label>{t('labels.priority')}</label>
            <p className={`${css.priority} ${priorityClass(fault.priority, css)}`}>
              {tPriority(fault.priority)}
            </p>
          </div>

          <div className={css.infoItem}>
            <label>{t('labels.planned')}</label>
            <p>
              {fault.plannedDate ? formatDate(fault.plannedDate) : '—'}
              {fault.plannedTime ? ` · ${fault.plannedTime}` : ''}
            </p>
          </div>
          <div className={css.infoItem}>
            <label>{t('labels.estimatedDuration')}</label>
            <p>
              {fault.estimatedDuration ? `${fault.estimatedDuration} min` : '—'}
            </p>
          </div>

          <div className={css.infoItem}>
            <label>{t('labels.deadline')}</label>
            <p className={`${css.deadline} ${deadlineUrgencyClass(fault.deadline, css)}`}>
              {formatDate(fault.deadline)}
            </p>
          </div>
          <div className={css.infoItem}>
            <label>{t('labels.assignedMaintainers')}</label>
            {fault.assignedMaintainers?.length ? (
              <div className={css.maintainerChips}>
                {fault.assignedMaintainers.map((m, i) => {
                  const isObj = typeof m === 'object' && m !== null;
                  const key = isObj ? m._id : String(m);
                  const name = isObj ? m.fullName : '—';
                  return (
                    <span
                      key={key ?? i}
                      className={css.maintainerChip}
                      title={isObj ? m.email : undefined}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className={css.maintainerEmpty}>—</p>
            )}
          </div>
        </div>

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
          {fault.typeFault === 'Safety' && (
            <div className={css.commentBox}>
              <label>{t('comments.hseNote')}</label>
              <p>{fault.commentSafety || t('comments.noNote')}</p>
            </div>
          )}
        </div>

        {fault.img && fault.img.length > 0 && (
          <div className={css.imageSection}>
            <label>{t('labels.attachedPhotos')}</label>
            <div className={css.imageGrid}>
              {fault.img.map((url, index) => (
                <div
                  key={index}
                  className={css.imageWrapper}
                  onClick={() => setSelectedImage(url as unknown as string)}
                >
                  <img
                    src={url as unknown as string}
                    alt={`Foto ${index + 1}`}
                    className={css.image}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

          {!isReadOnly && (
            <div className={css.actions}>
              <Button
                type="button"
                className="button button--blue"
                onClick={() => setIsPlanOpen(true)}
              >
                {fault.plannedDate
                  ? t('actions.modifyPlanning')
                  : t('actions.planIntervention')}
              </Button>
              {/* Reassign — only when there's already an assignee to
                  swap out (pool faults go through Pianifica instead). */}
              {fault.plannedDate &&
                (fault.assignedMaintainers?.length ?? 0) > 0 && (
                  <Button
                    type="button"
                    className="button button--white"
                    onClick={() => setIsReassignOpen(true)}
                  >
                    {tPlan('buttonReassign')}
                  </Button>
                )}
            </div>
          )}
        </div>
      </div>

      {isPlanOpen && (
        <PlanFaultForm fault={fault} onClose={() => setIsPlanOpen(false)} />
      )}
      {isReassignOpen && (
        <PlanFaultForm
          fault={fault}
          mode="reassign"
          onClose={() => setIsReassignOpen(false)}
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
};

export default ManagerFaultDetailPage;
