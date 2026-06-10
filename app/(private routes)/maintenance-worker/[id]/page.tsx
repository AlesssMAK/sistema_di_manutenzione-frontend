'use client';

import { use, useEffect, useState } from 'react';
import { fetchFaultById } from '@/lib/api/faults';
import { FaultCard } from '@/types/faultType';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import css from './page.module.css';
import { useRouter } from 'next/navigation';
import ImageModal from '@/components/UI/ImageModal/ImageModal';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Button from '@/components/UI/Button/Button';
import MaintenanceUpdateModal from '@/components/MaintenanceWorker/MaintenanceUpdateModal/MaintenanceUpdateModal';

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
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [fault, setFault] = useState<FaultCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  useEffect(() => {
    const getFaultData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchFaultById(id);
        setFault(data);
      } catch (error) {
        toast.error(t('errors.loadError'));
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) getFaultData();
  }, [id, t]);
  const handleBack = () => {
    router.push('/maintenance-worker');
  };

  const handleUpdateSuccess = (updatedData: FaultCard) => {
    setFault(prev => {
      if (!prev) return updatedData;
      return {
        ...updatedData,
        faultId: prev.faultId,
      };
    });
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
  if (!fault)
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

  return (
    <div className="container">
      <div className={css.pageWrapper}>
        <div className={css.card}>
          <header className={css.header}>
            <div className={css.headerLeft}>
              {/* Кнопка-стрелка назад */}
              <button
                type="button"
                className={css.backButton}
                onClick={handleBack}
                title={t('backButton')}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <h2 className={css.title}>{t('titleIntervento')}</h2>
            </div>
            <span className={css.idBadge}>{fault.faultId}</span>
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
                {fault.dataCreated
                  ? new Date(fault.dataCreated).toLocaleDateString('it-IT')
                  : '---'}{' '}
                {fault.timeCreated || ''}
              </p>
            </div>
            <div className={css.infoItem}>
              <label>{t('labels.lastUpdated')}</label>
              <p>{new Date(fault.updatedAt).toLocaleString('it-IT')}</p>
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
                    ? new Date(fault.deadline).toLocaleDateString('it-IT')
                    : t('labels.deadlineNotSet')}
                </p>
              </div>
              <div className={css.infoItem}>
                <label>{t('labels.estimatedDuration')}</label>
                <p>{fault.estimatedDuration || 0} min</p>
              </div>
            </div>
          </div>

          {/* Комментарии */}
          <div className={css.detailsBlock}>
            <div className={css.commentBox}>
              <label>{t('comments.operatorComment')}</label>
              <p>{fault.comment ? fault.comment : t('comments.noComment')}</p>
            </div>

            {/* Комментарий менеджера */}
            <div className={css.commentBox}>
              <label>{t('comments.managerComment')}</label>
              <p>
                {fault.managerComment
                  ? fault.managerComment
                  : t('comments.noComment')}
              </p>
            </div>

            {/* Commento Maintenance Worker */}
            <div className={css.commentBox}>
              <label>{t('comments.maintainerComment')}</label>
              <p>
                {fault.commentMaintenanceWorker
                  ? fault.commentMaintenanceWorker
                  : t('comments.noComment')}
              </p>
            </div>

            {/* Nota HSE — visibile solo per i fault Safety */}
            {fault.typeFault === 'Safety' && (
              <div className={css.commentBox}>
                <label>{t('comments.hseNote')}</label>
                <p>{fault.commentSafety || t('comments.noComment')}</p>
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
          <div className={css.actions}>
            <Button
              type="button"
              className="button button--blue"
              onClick={() => setIsUpdateModalOpen(true)}
            >
              {t('actions.addCommentAndChangeStatus')}
            </Button>
          </div>
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
