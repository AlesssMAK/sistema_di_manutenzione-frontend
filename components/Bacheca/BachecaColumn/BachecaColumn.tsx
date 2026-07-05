'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format, isValid, parseISO } from 'date-fns';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/authStore';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import {
  createAnnouncement,
  deleteAnnouncement,
  getPublicAnnouncements,
} from '@/lib/api/announcements';
import type {
  AnnouncementCategory,
  AnnouncementSeverity,
} from '@/types/announcementType';
import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import { UploadImages } from '@/components/UI/UploadImages/UploadImages';
import ImageModal from '@/components/UI/ImageModal/ImageModal';
import css from './BachecaColumn.module.css';

interface BachecaColumnProps {
  category: AnnouncementCategory;
  canCreate: boolean;
  /** handover only: show the optional machine picker. */
  withMachine?: boolean;
  /** announcement only: show the severity (emphasis) picker. */
  withSeverity?: boolean;
  /** Active-machine labels for the picker (`"Name - code"`). */
  plantLabels?: string[];
  /** Resolve a picker label back to its plant _id. */
  resolvePlantId?: (label: string) => string;
  plantsLoading?: boolean;
  /** Render the list as a 2-per-row grid instead of a single column. */
  gridLayout?: boolean;
}

// Every valid severity — used to sanitize legacy rows. 'normal' = plain.
const SEVERITY_VALUES: AnnouncementSeverity[] = [
  'normal',
  'communication',
  'note',
  'important',
  'attention',
];

// Selectable emphasis levels for the picker. 'normal' is the implicit
// default (plain card) and is intentionally NOT offered in the list.
const EMPHASIS_LEVELS = SEVERITY_VALUES.filter(s => s !== 'normal');

const BachecaColumn = ({
  category,
  canCreate,
  withMachine = false,
  withSeverity = false,
  plantLabels = [],
  resolvePlantId,
  plantsLoading = false,
  gridLayout = false,
}: BachecaColumnProps) => {
  const t = useTranslations('BachecaPage');
  const tNoFound = useTranslations('NoFound');
  const locale = getDateFnsLocale(useLocale());
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [machineLabel, setMachineLabel] = useState<string | null>(null);
  const [severity, setSeverity] = useState<AnnouncementSeverity>('normal');
  const [images, setImages] = useState<File[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const queryKey = ['announcements', 'public', category];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => getPublicAnnouncements({ category, perPage: 50 }),
    placeholderData: keepPreviousData,
  });

  const resetForm = () => {
    setTitle('');
    setBody('');
    setMachineLabel(null);
    setSeverity('normal');
    setImages([]);
    setShowForm(false);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        category,
        severity,
        plantId:
          withMachine && machineLabel && resolvePlantId
            ? resolvePlantId(machineLabel) || undefined
            : undefined,
        img: images,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(t('created'));
      resetForm();
    },
    onError: () => toast.error(t('saveError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(t('deleted'));
    },
    onError: () => toast.error(t('saveError')),
  });

  const items = data?.items ?? [];

  const formatWhen = (value?: string) => {
    if (!value) return '';
    const parsed = parseISO(value);
    return isValid(parsed)
      ? format(parsed, 'dd MMM yyyy, HH:mm', { locale })
      : value;
  };

  const canDelete = (authorId: string) =>
    user?.role === 'admin' || String(user?._id ?? '') === String(authorId);

  // A photo alone is enough — text is required only without a photo.
  const submitDisabled =
    createMutation.isPending ||
    (images.length === 0 && (!title.trim() || !body.trim()));

  // Leading "none" option keeps the machine optional (deselect).
  const machineNone = t('form.machineNone');
  const machineOptions = [machineNone, ...plantLabels];

  const severityOptions = EMPHASIS_LEVELS.map(value => ({
    value,
    label: t(`severity.${value}`),
  }));
  // 'normal' isn't in the list — show it as the greyed placeholder
  // instead of a selected value.
  const severityLabel =
    severity === 'normal'
      ? null
      : (severityOptions.find(o => o.value === severity)?.label ?? null);

  return (
    <section className={css.column}>
      <header className={css.header}>
        <div className={css.titleBox}>
          <h1 className="title">{t(`sections.${category}.title`)}</h1>
          <p className="subtitle">{t(`sections.${category}.subtitle`)}</p>
        </div>
        {canCreate && (
          <Button
            type="button"
            className="button button--blue"
            onClick={() => setShowForm(v => !v)}
          >
            {t(`sections.${category}.createCta`)}
          </Button>
        )}
      </header>

      {canCreate && showForm && (
        <form
          className={css.form}
          onSubmit={e => {
            e.preventDefault();
            if (!submitDisabled) createMutation.mutate();
          }}
        >
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('form.titlePlaceholder')}
            maxLength={200}
          />

          {withMachine && (
            <div className={css.field}>
              <label className={css.fieldLabel}>{t('form.machineLabel')}</label>
              <SelectDropdown
                options={machineOptions}
                selectedValue={machineLabel}
                onSelect={label =>
                  setMachineLabel(label === machineNone ? null : label)
                }
                placeholder={
                  plantsLoading
                    ? t('form.machineLoading')
                    : t('form.machinePlaceholder')
                }
                disabled={plantsLoading}
              />
            </div>
          )}

          {withSeverity && (
            <div className={css.field}>
              <label className={css.fieldLabel}>
                {t('form.severityLabel')}
              </label>
              <SelectDropdown
                options={severityOptions.map(o => o.label)}
                selectedValue={severityLabel}
                placeholder={t('severity.normal')}
                onSelect={label => {
                  const opt = severityOptions.find(o => o.label === label);
                  if (opt) setSeverity(opt.value);
                }}
              />
            </div>
          )}

          <textarea
            className={css.textarea}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={
              withMachine
                ? t('form.bodyPlaceholderConsegna')
                : t('form.bodyPlaceholder')
            }
            rows={4}
            maxLength={5000}
          />

          <div className={css.field}>
            <label className={css.fieldLabel}>{t('form.photosLabel')}</label>
            <UploadImages value={images} onChange={setImages} />
          </div>

          <div className={css.formActions}>
            <Button
              type="button"
              className="button button--white"
              onClick={resetForm}
            >
              {t('form.cancel')}
            </Button>
            <Button
              type="submit"
              className="button button--blue"
              disabled={submitDisabled}
            >
              {createMutation.isPending
                ? t('form.submitting')
                : t('form.submit')}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className={css.loadingWrap}>
          <Loader />
        </div>
      ) : isError ? (
        <NoFound
          title={tNoFound('serverErrorTitle')}
          message={t('errorLoad')}
        />
      ) : items.length === 0 ? (
        <NoFound
          title={tNoFound('noResultsTitle')}
          message={t(`sections.${category}.empty`)}
        />
      ) : (
        <ul className={gridLayout ? css.listGrid : css.list}>
          {items.map(a => {
            // Legacy rows may have no severity, or an old value that is
            // no longer a valid level — fall back to 'normal' (plain card)
            // so we never render an unknown i18n key.
            const sev: AnnouncementSeverity = SEVERITY_VALUES.includes(
              a.severity as AnnouncementSeverity
            )
              ? (a.severity as AnnouncementSeverity)
              : 'normal';
            return (
              <li
                key={a._id}
                className={`${css.card} ${css[`sev_${sev}`] ?? ''}`}
              >
                {a.img && a.img.length > 0 && (
                  <div className={css.imageBlock}>
                    {a.img.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        className={css.imageFullBtn}
                        onClick={() => setZoomedImage(url)}
                      >
                        <img
                          src={url}
                          alt={`${i + 1}`}
                          className={css.imageFull}
                        />
                      </button>
                    ))}
                  </div>
                )}
                <div className={css.cardHead}>
                  <div className={css.cardHeadMain}>
                    {(sev !== 'normal' || a.plantName) && (
                      <div className={css.badgeRow}>
                        {sev !== 'normal' && (
                          <span
                            className={`${css.sevBadge} ${
                              css[`sevBadge_${sev}`] ?? ''
                            }`}
                          >
                            {t(`severity.${sev}`)}
                          </span>
                        )}
                        {a.plantName && (
                          <span className={css.machineBadge}>
                            {a.plantName}
                          </span>
                        )}
                      </div>
                    )}
                    {a.title && <h3 className={css.cardTitle}>{a.title}</h3>}
                  </div>
                  {canDelete(a.authorId) && (
                    <button
                      type="button"
                      className={css.deleteBtn}
                      onClick={() => deleteMutation.mutate(a._id)}
                      aria-label={t('delete')}
                      title={t('delete')}
                    >
                      ×
                    </button>
                  )}
                </div>
                {a.body && <p className={css.cardBody}>{a.body}</p>}
                <p className={css.cardMeta}>
                  {a.authorName} · {formatWhen(a.createdAt)}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {zoomedImage && (
        <ImageModal
          imageUrl={zoomedImage}
          onClose={() => setZoomedImage(null)}
        />
      )}
    </section>
  );
};

export default BachecaColumn;
