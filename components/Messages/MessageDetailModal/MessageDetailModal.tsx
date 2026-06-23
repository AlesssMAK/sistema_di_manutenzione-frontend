'use client';

import { useEffect, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { markAsRead } from '@/lib/api/messages';
import type { Message } from '@/types/messageType';
import Modal from '@/components/UI/Modal/Modal';
import Button from '@/components/UI/Button/Button';
import ImageModal from '@/components/UI/ImageModal/ImageModal';
import ReplyForm from '../ReplyForm/ReplyForm';
import css from './MessageDetailModal.module.css';

interface MessageDetailModalProps {
  message: Message;
  currentUserId: string;
  onClose: () => void;
}

const formatFull = (value?: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed)
    ? format(parsed, "dd MMMM yyyy 'alle' HH:mm", { locale: it })
    : value;
};

const MessageDetailModal = ({
  message,
  currentUserId,
  onClose,
}: MessageDetailModalProps) => {
  const t = useTranslations('MessagesPage.detail');
  const tReply = useTranslations('MessagesPage.reply');
  const tMessages = useTranslations('MessagesPage.messages');
  const tRoles = useTranslations('Roles');
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const authorName =
    typeof message.authorId === 'object' && message.authorId
      ? message.authorId.fullName
      : message.authorName;

  // Don't offer a reply CTA when I'm the author — the backend
  // rejects self-reply with 400, and there's no useful UX in
  // letting someone reply to their own broadcast.
  const authorIdStr =
    typeof message.authorId === 'object' && message.authorId
      ? String(message.authorId._id)
      : String(message.authorId);
  const isAuthor = authorIdStr === String(currentUserId);

  // Auto-mark on first open so the badge ticks down immediately.
  // Idempotent on the backend ($addToSet), but skip if I'm already in readBy.
  const markMutation = useMutation({
    mutationFn: () => markAsRead(message._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: () => {
      toast.error(tMessages('markReadError'));
    },
  });

  useEffect(() => {
    if (!message.readBy.includes(currentUserId)) {
      markMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message._id]);

  const destinationLabel = () => {
    if (message.type === 'direct') return null;
    if (message.type === 'broadcast_all') return t('broadcastAll');
    return t('broadcastRole', {
      role: message.targetRole ? tRoles(message.targetRole) : '—',
    });
  };

  return (
    <>
    <Modal onClose={onClose}>
      <div className={css.wrap}>
        <h2 className={css.title}>{t('title')}</h2>

        {message.subject && (
          <h3 className={css.subject}>{message.subject}</h3>
        )}

        <div className={css.meta}>
          <span className={css.metaLabel}>{t('from')}</span>
          <span className={css.metaValue}>
            {authorName} · {tRoles(message.authorRole)}
          </span>

          {message.type !== 'direct' && (
            <>
              <span className={css.metaLabel}>{t('to')}</span>
              <span className={css.metaValue}>{destinationLabel()}</span>
            </>
          )}

          <span className={css.metaLabel}>{t('sent')}</span>
          <span className={css.metaValue}>{formatFull(message.createdAt)}</span>
        </div>

        <div className={css.body}>{message.body}</div>

        {message.img && message.img.length > 0 && (
          <div className={css.imageGrid}>
            {message.img.map((url, i) => (
              <button
                key={i}
                type="button"
                className={css.imageThumb}
                onClick={() => setZoomedImage(url)}
              >
                <img src={url} alt={`${i + 1}`} />
              </button>
            ))}
          </div>
        )}

        {isReplying ? (
          <div>
            <h4 className={css.replyTitle}>
              {tReply('title', { author: authorName })}
            </h4>
            <ReplyForm
              originalMessage={message}
              authorName={authorName}
              onSuccess={() => {
                setIsReplying(false);
                onClose();
              }}
              onCancel={() => setIsReplying(false)}
            />
          </div>
        ) : (
          <div className={css.actions}>
            <Button
              type="button"
              className="button button--white"
              onClick={onClose}
            >
              {t('close')}
            </Button>
            {!isAuthor && (
              <Button
                type="button"
                className="button button--blue"
                onClick={() => setIsReplying(true)}
              >
                {t('reply')}
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
    {zoomedImage && (
      <ImageModal imageUrl={zoomedImage} onClose={() => setZoomedImage(null)} />
    )}
    </>
  );
};

export default MessageDetailModal;
