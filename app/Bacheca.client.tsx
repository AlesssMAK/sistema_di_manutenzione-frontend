'use client';

import { useEffect, useState } from 'react';
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
import { usePageStore } from '@/lib/store/pageStore';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import {
  createAnnouncement,
  deleteAnnouncement,
  getPublicAnnouncements,
} from '@/lib/api/announcements';
import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import css from './Bacheca.module.css';

const BachecaClient = () => {
  const t = useTranslations('BachecaPage');
  const tNoFound = useTranslations('NoFound');
  const locale = getDateFnsLocale(useLocale());
  const { user } = useAuthStore();
  const setPageTitle = usePageStore(state => state.setPageTitle);
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    setPageTitle(t('title'));
  }, [setPageTitle, t]);

  const canCreate =
    user?.role === 'admin' || user?.permissions?.canCreateAnnouncements === true;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['announcements', 'public'],
    queryFn: () => getPublicAnnouncements({ page: 1, perPage: 50 }),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAnnouncement({ title: title.trim(), body: body.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'public'] });
      toast.success(t('created'));
      setTitle('');
      setBody('');
      setShowForm(false);
    },
    onError: () => toast.error(t('saveError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'public'] });
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

  const submitDisabled =
    createMutation.isPending || !title.trim() || !body.trim();

  return (
    <main className={css.main}>
      <div className="container">
        <header className={css.header}>
          <div className={css.titleBox}>
            <h1 className={css.title}>{t('title')}</h1>
            <p className={css.subtitle}>{t('subtitle')}</p>
          </div>
          <div className={css.actions}>
            {canCreate && (
              <Button
                type="button"
                className="button button--blue"
                onClick={() => setShowForm(v => !v)}
              >
                {t('createCta')}
              </Button>
            )}
          </div>
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
            <textarea
              className={css.textarea}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={t('form.bodyPlaceholder')}
              rows={4}
              maxLength={5000}
            />
            <div className={css.formActions}>
              <Button
                type="button"
                className="button button--white"
                onClick={() => setShowForm(false)}
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
          <NoFound title={tNoFound('noResultsTitle')} message={t('empty')} />
        ) : (
          <ul className={css.list}>
            {items.map(a => (
              <li key={a._id} className={css.card}>
                <div className={css.cardHead}>
                  <h3 className={css.cardTitle}>{a.title}</h3>
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
                <p className={css.cardBody}>{a.body}</p>
                <p className={css.cardMeta}>
                  {a.authorName} · {formatWhen(a.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};

export default BachecaClient;
