'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  replyMessageSchema,
  type ReplyMessageValues,
} from '@/lib/validation/replyMessageValidation';
import { replyToMessage } from '@/lib/api/messages';
import type { Message } from '@/types/messageType';
import Button from '@/components/UI/Button/Button';
import css from './ReplyForm.module.css';

interface ReplyFormProps {
  originalMessage: Message;
  authorName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const ReplyForm = ({
  originalMessage,
  authorName: _authorName,
  onSuccess,
  onCancel,
}: ReplyFormProps) => {
  const t = useTranslations('MessagesPage.reply');
  const tMessages = useTranslations('MessagesPage.messages');
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReplyMessageValues>({
    resolver: yupResolver(replyMessageSchema) as Resolver<ReplyMessageValues>,
    mode: 'onSubmit',
    defaultValues: {
      subject: originalMessage.subject ? `Re: ${originalMessage.subject}` : '',
      body: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ReplyMessageValues) =>
      replyToMessage(originalMessage._id, {
        subject: values.subject || undefined,
        body: values.body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success(tMessages('replySuccess'));
      onSuccess();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : tMessages('replyError');
      toast.error(message);
    },
  });

  const onSubmit = (values: ReplyMessageValues) => {
    mutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
      <div className={css.field}>
        <label className={css.label} htmlFor="reply-subject">
          {t('subjectLabel')}
        </label>
        <input
          id="reply-subject"
          type="text"
          className={css.input}
          placeholder={t('subjectPlaceholder')}
          {...register('subject')}
        />
        {errors.subject && (
          <p className={css.error}>{errors.subject.message}</p>
        )}
      </div>

      <div className={css.field}>
        <label className={css.label} htmlFor="reply-body">
          {t('bodyLabel')}
        </label>
        <textarea
          id="reply-body"
          className={css.textarea}
          rows={5}
          placeholder={t('bodyPlaceholder')}
          {...register('body')}
        />
        {errors.body && <p className={css.error}>{errors.body.message}</p>}
      </div>

      <div className={css.actions}>
        <Button
          type="button"
          className="button button--white"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          className="button button--blue"
          disabled={isSubmitting || mutation.isPending}
        >
          {mutation.isPending ? t('sending') : t('send')}
        </Button>
      </div>
    </form>
  );
};

export default ReplyForm;
