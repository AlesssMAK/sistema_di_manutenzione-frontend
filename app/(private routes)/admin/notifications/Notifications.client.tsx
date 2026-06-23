'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { usePageStore } from '@/lib/store/pageStore';
import {
  fetchFullSystemSettings,
  updateSystemSettings,
  type EmailSettings,
  type EmailTriggers,
  type MessagingSettings,
} from '@/lib/api/systemSettings';
import Input from '@/components/UI/Input/Input';
import Button from '@/components/UI/Button/Button';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import css from './Notifications.module.css';

const TRIGGER_KEYS: (keyof EmailTriggers)[] = [
  'onNewFault',
  'onAssignment',
  'onReassign',
  'onSicurezzaHse',
  'onDirectMessage',
  'onSuspended',
];

const AdminNotificationsClientPage = () => {
  const t = useTranslations('AdminPage.Notifications');
  const tPage = useTranslations('AdminPage');
  const tNoFound = useTranslations('NoFound');
  const setPageTitle = usePageStore((s) => s.setPageTitle);
  const queryClient = useQueryClient();

  const [email, setEmail] = useState<EmailSettings | null>(null);
  const [messaging, setMessaging] = useState<MessagingSettings | null>(null);

  useEffect(() => {
    setPageTitle(tPage('titlePageForStore'));
  }, [setPageTitle, tPage]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['systemSettings', 'full'],
    queryFn: fetchFullSystemSettings,
    refetchOnWindowFocus: false,
  });

  // Seed local editable state once the settings arrive.
  useEffect(() => {
    if (data) {
      setEmail(data.email);
      setMessaging(data.messaging);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success(t('messages.saved'));
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : t('messages.error');
      toast.error(message);
    },
  });

  if (isLoading || !email || !messaging) {
    return (
      <section className="admin_section">
        <div className={css.loaderWrap}>
          <Loader />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="admin_section">
        <NoFound
          title={tNoFound('serverErrorTitle')}
          message={tNoFound('serverErrorMessage')}
        />
      </section>
    );
  }

  const onSave = () => {
    mutation.mutate({ email, messaging });
  };

  return (
    <section className="admin_section">
      <div className={css.header}>
        <h1 className="title">{t('title')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
      </div>

      {/* ── Email ──────────────────────────────────────────────── */}
      <div className={css.card}>
        <h2 className={css.cardTitle}>{t('email.section')}</h2>

        <label className={css.toggleRow}>
          <input
            type="checkbox"
            className={css.toggleInput}
            checked={email.enabled}
            onChange={(e) => setEmail({ ...email, enabled: e.target.checked })}
            id="email-enabled"
          />
          <span className={css.toggleSwitch} />
          <span className={css.toggleLabel}>{t('email.enabled')}</span>
        </label>

        <div className={css.field}>
          <label className={css.fieldLabel}>{t('email.from')}</label>
          <Input
            type="email"
            value={email.from}
            onChange={(e) => setEmail({ ...email, from: e.target.value })}
            disabled={!email.enabled}
            style={{
              height: '36px',
              borderRadius: '6px',
              background: '#f3f3f5',
              border: 'none',
            }}
          />
        </div>

        <h3 className={css.subTitle}>{t('email.triggers.section')}</h3>
        <div className={css.triggerList}>
          {TRIGGER_KEYS.map((key) => (
            <label key={key} className={css.toggleRow}>
              <input
                type="checkbox"
                className={css.toggleInput}
                checked={email.triggers[key]}
                disabled={!email.enabled}
                onChange={(e) =>
                  setEmail({
                    ...email,
                    triggers: { ...email.triggers, [key]: e.target.checked },
                  })
                }
              />
              <span className={css.toggleSwitch} />
              <span className={css.toggleLabel}>
                {t(`email.triggers.${key}`)}
              </span>
            </label>
          ))}
        </div>

        <div className={css.field}>
          <label className={css.fieldLabel}>{t('email.rateLimit')}</label>
          <Input
            type="number"
            min={0}
            max={1000}
            value={email.rateLimits.perRecipientPerHour}
            onChange={(e) =>
              setEmail({
                ...email,
                rateLimits: { perRecipientPerHour: Number(e.target.value) },
              })
            }
            disabled={!email.enabled}
            style={{
              height: '36px',
              borderRadius: '6px',
              background: '#f3f3f5',
              border: 'none',
              maxWidth: '160px',
            }}
          />
        </div>
      </div>

      {/* ── Messaging ──────────────────────────────────────────── */}
      <div className={css.card}>
        <h2 className={css.cardTitle}>{t('messaging.section')}</h2>

        <div className={css.field}>
          <label className={css.fieldLabel}>
            {t('messaging.broadcastTtl')}
          </label>
          <Input
            type="number"
            min={1}
            max={365}
            value={messaging.broadcastTtlDays}
            onChange={(e) =>
              setMessaging({
                ...messaging,
                broadcastTtlDays: Number(e.target.value),
              })
            }
            style={{
              height: '36px',
              borderRadius: '6px',
              background: '#f3f3f5',
              border: 'none',
              maxWidth: '160px',
            }}
          />
        </div>

        <div className={css.field}>
          <label className={css.fieldLabel}>
            {t('messaging.directRateLimit')}
          </label>
          <Input
            type="number"
            min={0}
            max={1000}
            value={messaging.directRateLimitPerHour}
            onChange={(e) =>
              setMessaging({
                ...messaging,
                directRateLimitPerHour: Number(e.target.value),
              })
            }
            style={{
              height: '36px',
              borderRadius: '6px',
              background: '#f3f3f5',
              border: 'none',
              maxWidth: '160px',
            }}
          />
        </div>
      </div>

      <div className={css.actions}>
        <Button
          type="button"
          className="button button--blue"
          onClick={onSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? t('messages.saving') : t('save')}
        </Button>
      </div>
    </section>
  );
};

export default AdminNotificationsClientPage;
