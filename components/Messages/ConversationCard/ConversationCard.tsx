'use client';

import { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import { deleteThread } from '@/lib/api/messages';
import type { Conversation } from '@/types/messageType';
import css from './ConversationCard.module.css';

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId: string;
  onOpen: (conversation: Conversation) => void;
}

const formatDateTime = (
  value: string | undefined,
  locale: ReturnType<typeof getDateFnsLocale>
) => {
  if (!value) return '';
  const parsed = parseISO(value);
  return isValid(parsed)
    ? format(parsed, 'dd MMM yyyy, HH:mm', { locale })
    : value;
};

const ConversationCard = ({
  conversation,
  currentUserId,
  onOpen,
}: ConversationCardProps) => {
  const t = useTranslations('MessagesPage.card');
  const tDetail = useTranslations('MessagesPage.detail');
  const tMessages = useTranslations('MessagesPage.messages');
  const tRoles = useTranslations('Roles');
  const locale = getDateFnsLocale(useLocale());
  const queryClient = useQueryClient();

  const [confirming, setConfirming] = useState(false);

  const { counterpart, unread, last, subject } = conversation;
  const isUnread = unread > 0;
  const lastIsMine = String(last.authorId) === String(currentUserId);

  const deleteMutation = useMutation({
    mutationFn: () => deleteThread(last._id),
    onSuccess: () => {
      toast.success(tMessages('conversationDeleted'));
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: () => {
      toast.error(tMessages('deleteError'));
      setConfirming(false);
    },
  });

  return (
    <li
      className={`${css.card} ${isUnread ? css.unread : ''}`}
      onClick={() => onOpen(conversation)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if ((e.target as HTMLElement).closest('button')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(conversation);
        }
      }}
    >
      <div className={css.header}>
        <div className={css.left}>
          {isUnread && (
            <span className={css.unreadDot} aria-label={t('unread')} />
          )}
          <span className={css.name}>{counterpart.fullName}</span>
          <span className={css.role}>· {tRoles(counterpart.role)}</span>
          {isUnread && <span className={css.badge}>{unread}</span>}
        </div>
        <div className={css.headerRight}>
          <span className={css.date}>
            {formatDateTime(last.createdAt, locale)}
          </span>
          <button
            type="button"
            className={css.deleteThread}
            aria-label={t('deleteThread')}
            title={t('deleteThread')}
            onClick={e => {
              e.stopPropagation();
              setConfirming(v => !v);
            }}
          >
            <svg width="18" height="18" aria-hidden="true">
              <use href="/sprite.svg#close" />
            </svg>
          </button>
        </div>
      </div>

      {(subject || last.subject) && (
        <h4 className={css.subject}>{subject || last.subject}</h4>
      )}
      <p className={css.preview}>
        {lastIsMine && (
          <span className={css.youPrefix}>{tDetail('you')}: </span>
        )}
        {last.body}
      </p>

      {confirming && (
        <div className={css.confirmRow} onClick={e => e.stopPropagation()}>
          <span className={css.confirmText}>{t('deleteThreadConfirm')}</span>
          <button
            type="button"
            className={css.confirmYes}
            disabled={deleteMutation.isPending}
            onClick={e => {
              e.stopPropagation();
              deleteMutation.mutate();
            }}
          >
            {t('yes')}
          </button>
          <button
            type="button"
            className={css.confirmNo}
            onClick={e => {
              e.stopPropagation();
              setConfirming(false);
            }}
          >
            {t('no')}
          </button>
        </div>
      )}
    </li>
  );
};

export default ConversationCard;
