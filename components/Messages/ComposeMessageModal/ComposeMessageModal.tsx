'use client';

import { useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Modal from '@/components/UI/Modal/Modal';
import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import {
  composeMessageSchema,
  type ComposeMessageValues,
} from '@/lib/validation/composeMessageValidation';
import { createBroadcast, createDirectMessage } from '@/lib/api/messages';
import { getAllUsers } from '@/lib/api/users';
import type { UserRoles } from '@/types/userTypes';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import css from './ComposeMessageModal.module.css';

type Channel = 'direct' | 'broadcastAll' | 'broadcastRole';

interface ComposeMessageModalProps {
  currentUserId: string;
  /** Channels the current user is allowed to use. Operators get
   *  filtered out of 'direct' by the backend; the caller decides
   *  which channels to surface. */
  allowedChannels: Channel[];
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
  const tBtn = useTranslations('btn');
  const tRoles = useTranslations('Roles');
  const queryClient = useQueryClient();

  const defaultChannel: Channel = allowedChannels[0] ?? 'broadcastAll';

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

  const channel = watch('channel') as Channel;
  const recipientId = watch('recipientId');
  const targetRole = watch('targetRole');

  // ---- channel selector via SelectDropdown -------------------------
  const channelOptions = useMemo(
    () => allowedChannels.map((c) => ({ value: c, label: t(`channels.${c}`) })),
    [allowedChannels, t],
  );
  const channelMapper = useMemo(
    () => createOptionMapper(channelOptions),
    [channelOptions],
  );

  // ---- recipient list for direct -----------------------------------
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'all-for-compose'],
    queryFn: () => getAllUsers({ perPage: 200 }),
    enabled: channel === 'direct',
  });

  const recipientOptions = useMemo(() => {
    const all = usersData?.users ?? [];
    return all
      .filter((u) => u._id !== currentUserId && u.status === 'active')
      .map((u) => ({
        value: u._id,
        label: `${u.fullName} — ${tRoles(u.role)}`,
      }));
  }, [usersData, currentUserId, tRoles]);
  const recipientMapper = useMemo(
    () => createOptionMapper(recipientOptions),
    [recipientOptions],
  );

  // ---- role list for broadcastRole ---------------------------------
  const roleOptions = useMemo(
    () => TARGETABLE_ROLES.map((r) => ({ value: r, label: tRoles(r) })),
    [tRoles],
  );
  const roleMapper = useMemo(
    () => createOptionMapper(roleOptions),
    [roleOptions],
  );

  // ---- mutation ----------------------------------------------------
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
      <div className={css.form_container}>
        <div className={css.title_container}>
          <h1 className="title">{t('title')}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
          {allowedChannels.length > 1 && (
            <div className={css.form_item_container}>
              <p className={css.form_label}>{t('labels.channel')} *</p>
              <SelectDropdown
                selectedValue={channelMapper.getLabelByValue(channel) ?? ''}
                options={channelMapper.labelsArray}
                onSelect={(label) => {
                  const value = channelMapper.getValueByLabel(label);
                  if (!value) return;
                  setValue('channel', value);
                  // Wipe off-channel fields so a stale selection
                  // doesn't bleed into the new payload.
                  if (value !== 'direct') setValue('recipientId', '');
                  if (value !== 'broadcastRole') setValue('targetRole', '');
                }}
              />
              <Input type="hidden" {...register('channel')} />
            </div>
          )}

          {channel === 'direct' && (
            <div className={css.form_item_container}>
              <p className={css.form_label}>{t('labels.recipient')} *</p>
              <SelectDropdown
                disabled={usersLoading}
                placeholder={
                  usersLoading
                    ? t('placeholders.loadingRecipients')
                    : t('placeholders.recipient')
                }
                selectedValue={recipientMapper.getLabelByValue(recipientId) ?? ''}
                options={recipientMapper.labelsArray}
                onSelect={(label) => {
                  const value = recipientMapper.getValueByLabel(label) ?? '';
                  setValue('recipientId', value, { shouldValidate: true });
                }}
              />
              <Input type="hidden" {...register('recipientId')} />
              {errors.recipientId && (
                <p className={css.error}>{errors.recipientId.message}</p>
              )}
            </div>
          )}

          {channel === 'broadcastRole' && (
            <div className={css.form_item_container}>
              <p className={css.form_label}>{t('labels.targetRole')} *</p>
              <SelectDropdown
                placeholder={t('placeholders.targetRole')}
                selectedValue={
                  roleMapper.getLabelByValue(targetRole as UserRoles) ?? ''
                }
                options={roleMapper.labelsArray}
                onSelect={(label) => {
                  const value = roleMapper.getValueByLabel(label) ?? '';
                  setValue('targetRole', value, { shouldValidate: true });
                }}
              />
              <Input type="hidden" {...register('targetRole')} />
              {errors.targetRole && (
                <p className={css.error}>{errors.targetRole.message}</p>
              )}
            </div>
          )}

          <div className={css.form_item_container}>
            <p className={css.form_label}>{t('labels.subject')}</p>
            <Input
              {...register('subject')}
              type="text"
              placeholder={t('placeholders.subject')}
              style={{
                height: '36px',
                borderRadius: '6px',
                background: '#f3f3f5',
                border: 'none',
              }}
            />
            {errors.subject && (
              <p className={css.error}>{errors.subject.message}</p>
            )}
          </div>

          <div className={css.form_item_container}>
            <p className={css.form_label}>{t('labels.body')} *</p>
            <textarea
              {...register('body')}
              className={css.textarea}
              rows={6}
              placeholder={t('placeholders.body')}
            />
            {errors.body && <p className={css.error}>{errors.body.message}</p>}
          </div>

          <div className={css.btn_form_container}>
            <Button
              type="button"
              className="button button--white"
              width="100%"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              type="submit"
              className="button button--blue"
              width="100%"
              disabled={isSubmitting || mutation.isPending}
            >
              {mutation.isPending
                ? tBtn('loading')
                : t('buttons.send')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ComposeMessageModal;
