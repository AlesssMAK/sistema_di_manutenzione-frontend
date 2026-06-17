'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { fetchFaultById } from '@/lib/api/faults';
import { updateSafetyComment } from '@/lib/api/safety';
import { useAuthStore } from '@/lib/store/authStore';
import { useSocket } from '@/providers/SocketProvider/SocketProvider';
import ImageModal from '@/components/UI/ImageModal/ImageModal';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Button from '@/components/UI/Button/Button';
import css from './page.module.css';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed)
    ? format(parsed, 'dd MMMM yyyy', { locale: it })
    : value;
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed)
    ? format(parsed, 'dd MMMM yyyy HH:mm', { locale: it })
    : value;
};

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

const SafetyFaultDetailPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const router = useRouter();
  const t = useTranslations('FaultDetail');
  const tSafety = useTranslations('SafetyPage');
  const tNoFound = useTranslations('NoFound');
  const tStatus = useTranslations('StatusFault');
  const tType = useTranslations('TypeFault');
  const tPriority = useTranslations('Priority');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const { subscribeToFault, unsubscribeFromFault } = useSocket();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  // When a note already exists we want a read-only view by default —
  // the user clicks "Modifica la nota" to enter edit mode.
  const [isEditingNote, setIsEditingNote] = useState(false);

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

  // Sync draft with server value when fault loads / updates via socket
  useEffect(() => {
    if (fault?.commentSafety !== undefined) {
      setCommentDraft(fault.commentSafety ?? '');
    }
  }, [fault?._id, fault?.commentSafety]);

  const mutation = useMutation({
    mutationFn: (text: string) => updateSafetyComment(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fault', id] });
      queryClient.invalidateQueries({ queryKey: ['faults'] });
      toast.success(t('hseSection.saved'));
      // Drop back to read-only view once the save lands.
      setIsEditingNote(false);
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : t('hseSection.saveError');
      toast.error(message);
    },
  });

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

  const canEditComment = user?.role === 'safety' || user?.role === 'admin';
  const draftChanged = commentDraft.trim() !== (fault.commentSafety ?? '').trim();
  const hasSavedNote = Boolean(fault.commentSafety?.trim());
  // Show the textarea when the user is actively editing, OR when no
  // note exists yet (the assumed first-write flow). Non-editors never
  // see the editor regardless.
  const showEditor = canEditComment && (isEditingNote || !hasSavedNote);

  return (
    <div className="container">
      <div className={css.pageWrapper}>
        <div className={css.card}>
        <header className={css.header}>
          <div className={css.headerLeft}>
            <button
              type="button"
              className={css.backButton}
              onClick={() => router.push('/safety')}
              title={t('backButton')}
              aria-label={t('backButton')}
            >
              <svg width="20" height="20" aria-hidden="true">
                <use href="/sprite.svg#arrow_back_ios_new" />
              </svg>
            </button>
            <h2 className={css.title}>
              {t('title')}
              <span className={css.hseBadge}>{tSafety('badge')}</span>
            </h2>
          </div>
          <span className={css.idBadge}>{fault.faultId}</span>
        </header>

        <div className={css.infoGrid}>
          {/* Short pair on phone: operator + status badge */}
          <div className={css.infoRow}>
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
          </div>

          {/* Full-width on phone: italian-formatted dates are too long
              to split at 320px (≈"01 febbraio 2026 · 12:34"). */}
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

          {/* Full-width on phone: plant/part names with codes are
              unpredictably long. */}
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

          {/* Full-width on phone: planned has a time suffix, deadline
              uses italian full-month formatting. */}
          <div className={css.infoItem}>
            <label>{t('labels.planned')}</label>
            <p>
              {fault.plannedDate ? formatDate(fault.plannedDate) : '—'}
              {fault.plannedTime ? ` · ${fault.plannedTime}` : ''}
            </p>
          </div>
          <div className={css.infoItem}>
            <label>{t('labels.deadline')}</label>
            <p className={css.deadline}>{formatDate(fault.deadline)}</p>
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

        {showEditor ? (
          /* Edit mode: keep the HSE-styled red callout so the user
             sees this is a safety-critical edit context. */
          <div className={css.hseSection}>
            <label className={css.hseLabel}>{t('hseSection.label')}</label>
            <textarea
              className={css.hseTextarea}
              rows={4}
              maxLength={2000}
              value={commentDraft}
              onChange={e => setCommentDraft(e.target.value)}
              placeholder={t('hseSection.placeholder')}
              disabled={mutation.isPending}
            />
            <div className={css.hseActions}>
              <span className={css.hseCounter}>
                {commentDraft.length} / 2000
              </span>
              <Button
                type="button"
                className="button button--blue"
                onClick={() => mutation.mutate(commentDraft.trim())}
                disabled={mutation.isPending || !draftChanged}
              >
                {mutation.isPending
                  ? t('hseSection.saving')
                  : t('hseSection.saveButton')}
              </Button>
            </div>
          </div>
        ) : (
          /* Read-only mode: blend the saved note into the rest of the
             comments column (no red callout, plain commentBox style)
             so it doesn't keep screaming after the user has already
             written it. Edit button sits below. */
          <div className={css.hseReadonlyBlock}>
            <div className={css.commentBox}>
              <label>{t('hseSection.label')}</label>
              <p>{fault.commentSafety || t('hseSection.emptyReadonly')}</p>
            </div>
            {canEditComment && hasSavedNote && (
              <div className={`${css.hseActions} ${css.hseActionsEnd}`}>
                <Button
                  type="button"
                  className="button button--blue"
                  onClick={() => setIsEditingNote(true)}
                >
                  {t('hseSection.editButton')}
                </Button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

export default SafetyFaultDetailPage;
