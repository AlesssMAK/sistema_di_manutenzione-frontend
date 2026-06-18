'use client';

import { useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Modal from '@/components/UI/Modal/Modal';
import Button from '@/components/UI/Button/Button';
import {
  composeMessageSchema,
  type ComposeMessageValues,
} from '@/lib/validation/composeMessageValidation';
import { createBroadcast, createDirectMessage } from '@/lib/api/messages';
import { getAllUsers } from '@/lib/api/users';
import type { UserRoles } from '@/types/userTypes';
import css from './ComposeMessageModal.module.css';

interface ComposeMessageModalProps {
  currentUserId: string;
  /** Channels the current user is allowed to use. Operators get
   *  filtered out of 'direct' by the backend; the caller decides
   *  which channels to surface. */
  allowedChannels: Array<'direct' | 'broadcastAll' | 'broadcastRole'>;
  onClose: () => void;
}

const TARGETABLE_ROLES: UserRoles[] = [
  'operator',
  'admin',
  'manager',
  'maintenanceWorker',
  'safety',
];

const ComposeMessageModal = ({
  currentUserId,
  allowedChannels,
  onClose,
}: ComposeMessageModalProps) => {
  const t = useTranslations('MessagesPage.compose');
  const tRoles = useTranslations('Roles');
  const queryClient = useQueryClient();

  const defaultChannel = allowedChannels[0] ?? 'broadcastAll';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ComposeMessageValues>({
    resolver: yupResolver(
      composeMessageSchema,
    ) as Resolver<ComposeMessageValues>,
    mode: 'onSubmit',
    defaultValues: {
      channel: defaultChannel,
      recipientId: '',
      targetRole: '',
      subject: '',
      body: '',
    },
  });

  const channel = watch('channel');

  // Recipients only matter for direct messages — fetch when that
  // tab is active. Filters out self + deactivated users; the BE
  // would reject either anyway, but failing in the picker is a
  // better UX than after the user types out a message.
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'all-for-compose'],
    queryFn: () => getAllUsers({ perPage: 200 }),
    enabled: channel === 'direct',
  });

  const recipients = useMemo(() => {
    const all = usersData?.users ?? [];
    return all.filter(
      (u) => u._id !== currentUserId && u.status === 'active',
    );
  }, [usersData, currentUserId]);

  const mutation = useMutation({
    mutationFn: async (values: ComposeMessageValues) => {
      if (values.channel === 'direct') {
        return createDirectMessage({
          recipientId: values.recipientId,
          subject: values.subject || undefined,
          body: values.body,
        });
      }
      if (values.channel === 'broadcastRole') {
        return createBroadcast({
          target: 'role',
          targetRole: values.targetRole as UserRoles,
          subject: values.subject || undefined,
          body: values.body,
        });
      }
      return createBroadcast({
        target: 'all',
        subject: values.subject || undefined,
        body: values.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unreadCount'] });
      toast.success(t('messages.sendSuccess'));
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : t('messages.sendError');
      toast.error(message);
    },
  });

  const onSubmit = (values: ComposeMessageValues) => mutation.mutate(values);

  return (
    <Modal onClose={onClose}>
      <div className={css.container}>
        <div className={css.titleWrap}>
          <h1 className={css.title}>{t('title')}</h1>
          <p className={css.subtitle}>{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
          {allowedChannels.length > 1 && (
            <div className={css.channelTabs}>
              {allowedChannels.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`${css.channelTab} ${channel === ch ? css.channelTabActive : ''}`}
                  onClick={() => {
                    setValue('channel', ch);
                    // Wipe the off-channel fields so a previous
                    // selection doesn't bleed into the new payload.
                    if (ch !== 'direct') setValue('recipientId', '');
                    if (ch !== 'broadcastRole') setValue('targetRole', '');
                  }}
                >
                  {t(`channels.${ch}`)}
                </button>
              ))}
            </div>
          )}

          {channel === 'direct' && (
            <div className={css.field}>
              <label className={css.label} htmlFor="compose-recipient">
                {t('labels.recipient')}
              </label>
              <select
                id="compose-recipient"
                className={css.input}
                disabled={usersLoading}
                {...register('recipientId')}
              >
                <option value="">
                  {usersLoading
                    ? t('placeholders.loadingRecipients')
                    : t('placeholders.recipient')}
                </option>
                {recipients.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.fullName} — {tRoles(u.role)}
                  </option>
                ))}
              </select>
              {errors.recipientId && (
                <p className={css.error}>{errors.recipientId.message}</p>
              )}
            </div>
          )}

          {channel === 'broadcastRole' && (
            <div className={css.field}>
              <label className={css.label} htmlFor="compose-role">
                {t('labels.targetRole')}
              </label>
              <select
                id="compose-role"
                className={css.input}
                {...register('targetRole')}
              >
                <option value="">{t('placeholders.targetRole')}</option>
                {TARGETABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {tRoles(r)}
                  </option>
                ))}
              </select>
              {errors.targetRole && (
                <p className={css.error}>{errors.targetRole.message}</p>
              )}
            </div>
          )}

          <div className={css.field}>
            <label className={css.label} htmlFor="compose-subject">
              {t('labels.subject')}
            </label>
            <input
              id="compose-subject"
              type="text"
              className={css.input}
              placeholder={t('placeholders.subject')}
              {...register('subject')}
            />
            {errors.subject && (
              <p className={css.error}>{errors.subject.message}</p>
            )}
          </div>

          <div className={css.field}>
            <label className={css.label} htmlFor="compose-body">
              {t('labels.body')}
            </label>
            <textarea
              id="compose-body"
              className={css.textarea}
              rows={6}
              placeholder={t('placeholders.body')}
              {...register('body')}
            />
            {errors.body && (
              <p className={css.error}>{errors.body.message}</p>
            )}
          </div>

          <div className={css.actions}>
            <Button
              type="button"
              className="button button--white"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              type="submit"
              className="button button--blue"
              disabled={isSubmitting || mutation.isPending}
            >
              {mutation.isPending ? t('buttons.sending') : t('buttons.send')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ComposeMessageModal;
