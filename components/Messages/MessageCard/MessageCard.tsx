'use client';

import { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import { deleteThread } from '@/lib/api/messages';
import { useAuthStore } from '@/lib/store/authStore';
import type { Message } from '@/types/messageType';
import css from './MessageCard.module.css';

interface MessageCardProps {
  message: Message;
  currentUserId: string;
  onClick: (message: Message) => void;
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

const MessageCard = ({ message, currentUserId, onClick }: MessageCardProps) => {
  const t = useTranslations('MessagesPage.card');
  const tMessages = useTranslations('MessagesPage.messages');
  const tRoles = useTranslations('Roles');
  const locale = getDateFnsLocale(useLocale());
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore(state => state.user?.role === 'admin');

  const [confirming, setConfirming] = useState(false);

  const isUnread = !message.readBy.includes(currentUserId);
  const authorName =
    typeof message.authorId === 'object' && message.authorId
      ? message.authorId.fullName
      : message.authorName;

  const authorIdStr =
    typeof message.authorId === 'object' && message.authorId
      ? String(message.authorId._id)
      : String(message.authorId);

  // The direct inbox lists both received and sent messages. A message I
  // authored is outgoing → show the recipient (the counterpart) instead
  // of myself, with a direction badge. Broadcasts keep the author.
  const recipient =
    typeof message.recipientId === 'object' && message.recipientId
      ? message.recipientId
      : null;
  const isOutgoing =
    message.type === 'direct' && authorIdStr === String(currentUserId);
  const counterpartName = isOutgoing
    ? (recipient?.fullName ?? '—')
    : authorName;
  const counterpartRole = isOutgoing
    ? recipient?.role
    : message.authorRole;

  // Whole-conversation delete: direct threads can be wiped by either
  // participant; broadcasts only by their author or an admin.
  const canDeleteThread =
    message.type === 'direct' ||
    authorIdStr === String(currentUserId) ||
    isAdmin;

  const deleteMutation = useMutation({
    mutationFn: () => deleteThread(message._id),
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
      onClick={() => onClick(message)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        // Let the inner delete controls handle their own keys.
        if ((e.target as HTMLElement).closest('button')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(message);
        }
      }}
    >
      <div className={css.header}>
        <div className={css.author}>
          {isUnread && (
            <span className={css.unreadDot} aria-label={t('unread')} />
          )}
          {message.type === 'direct' && (
            <span
              className={`${css.direction} ${
                isOutgoing ? css.directionSent : css.directionReceived
              }`}
            >
              {isOutgoing ? t('sent') : t('received')}
            </span>
          )}
          <span className={css.authorName}>{counterpartName}</span>
          {counterpartRole && (
            <span className={css.authorRole}>· {tRoles(counterpartRole)}</span>
          )}
        </div>
        <div className={css.headerRight}>
          <span className={css.date}>
            {formatDateTime(message.createdAt, locale)}
          </span>
          {canDeleteThread && (
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
          )}
        </div>
      </div>

      {message.subject && <h4 className={css.subject}>{message.subject}</h4>}
      <p className={css.preview}>{message.body}</p>

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

export default MessageCard;
