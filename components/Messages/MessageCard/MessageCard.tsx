'use client';

import { format, isValid, parseISO } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
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
  const tRoles = useTranslations('Roles');
  const locale = getDateFnsLocale(useLocale());

  const isUnread = !message.readBy.includes(currentUserId);
  const authorName =
    typeof message.authorId === 'object' && message.authorId
      ? message.authorId.fullName
      : message.authorName;

  return (
    <li
      className={`${css.card} ${isUnread ? css.unread : ''}`}
      onClick={() => onClick(message)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
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
          <span className={css.authorName}>{authorName}</span>
          <span className={css.authorRole}>· {tRoles(message.authorRole)}</span>
        </div>
        <span className={css.date}>
          {formatDateTime(message.createdAt, locale)}
        </span>
      </div>

      {message.subject && (
        <h4 className={css.subject}>{message.subject}</h4>
      )}
      <p className={css.preview}>{message.body}</p>
    </li>
  );
};

export default MessageCard;
