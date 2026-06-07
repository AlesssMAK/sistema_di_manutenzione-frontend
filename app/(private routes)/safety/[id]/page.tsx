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

const SafetyFaultDetailPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const router = useRouter();
  const tNoFound = useTranslations('NoFound');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const { subscribeToFault, unsubscribeFromFault } = useSocket();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

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
      toast.success('Nota HSE salvata');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Errore durante il salvataggio della nota';
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
            message="Segnalazione non trovata"
          />
        </div>
      </div>
    );

  const canEditComment = user?.role === 'safety' || user?.role === 'admin';
  const draftChanged = commentDraft.trim() !== (fault.commentSafety ?? '').trim();

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
              title="Torna indietro"
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
            <h2 className={css.title}>
              Dettaglio segnalazione
              <span className={css.hseBadge}>HSE</span>
            </h2>
          </div>
          <span className={css.idBadge}>{fault.faultId}</span>
        </header>

        <div className={css.infoGrid}>
          <div className={css.infoItem}>
            <label>Operatore</label>
            <p>{fault.nameOperator || '—'}</p>
          </div>
          <div className={css.infoItem}>
            <label>Stato</label>
            <span
              className={`${css.status} ${
                css[`status${fault.statusFault.replace(' ', '')}`] || ''
              }`}
            >
              {fault.statusFault}
            </span>
          </div>

          <div className={css.infoItem}>
            <label>Data creazione</label>
            <p>
              {formatDate(fault.dataCreated)}
              {fault.timeCreated ? ` · ${fault.timeCreated}` : ''}
            </p>
          </div>
          <div className={css.infoItem}>
            <label>Ultimo aggiornamento</label>
            <p>{formatDateTime(fault.updatedAt)}</p>
          </div>

          <div className={css.infoItem}>
            <label>Impianto</label>
            <p>
              {fault.plantId?.namePlant ?? '—'}
              {fault.plantId?.code ? ` (${fault.plantId.code})` : ''}
            </p>
          </div>
          <div className={css.infoItem}>
            <label>Parte di impianto</label>
            <p>
              {fault.partId?.namePlantPart ?? '—'}
              {fault.partId?.codePlantPart
                ? ` (${fault.partId.codePlantPart})`
                : ''}
            </p>
          </div>

          <div className={css.infoItem}>
            <label>Tipo guasto</label>
            <p>{fault.typeFault}</p>
          </div>
          <div className={css.infoItem}>
            <label>Priorità</label>
            <p className={css.priority}>{fault.priority}</p>
          </div>

          <div className={css.infoItem}>
            <label>Pianificato</label>
            <p>
              {fault.plannedDate ? formatDate(fault.plannedDate) : '—'}
              {fault.plannedTime ? ` · ${fault.plannedTime}` : ''}
            </p>
          </div>
          <div className={css.infoItem}>
            <label>Scadenza</label>
            <p className={css.deadline}>{formatDate(fault.deadline)}</p>
          </div>
        </div>

        <div className={css.detailsBlock}>
          <div className={css.commentBox}>
            <label>Descrizione (Operatore)</label>
            <p>{fault.comment || 'Nessuna descrizione'}</p>
          </div>
          <div className={css.commentBox}>
            <label>Note responsabile</label>
            <p>{fault.managerComment || 'Nessuna nota'}</p>
          </div>
          <div className={css.commentBox}>
            <label>Note manutentore</label>
            <p>{fault.commentMaintenanceWorker || 'Nessuna nota'}</p>
          </div>
        </div>

        {fault.img && fault.img.length > 0 && (
          <div className={css.imageSection}>
            <label>Foto allegate</label>
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

        <div className={css.hseSection}>
          <label className={css.hseLabel}>Nota HSE (Sicurezza)</label>
          {canEditComment ? (
            <>
              <textarea
                className={css.hseTextarea}
                rows={4}
                maxLength={2000}
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
                placeholder="Scrivi qui la tua valutazione di sicurezza..."
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
                  {mutation.isPending ? 'Salvataggio...' : 'Salva nota'}
                </Button>
              </div>
            </>
          ) : (
            <p className={css.hseReadonly}>
              {fault.commentSafety || 'Nessuna nota HSE'}
            </p>
          )}
        </div>
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
