'use client';

import { useEffect, useRef, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import toast from 'react-hot-toast';
import { deleteMessage, getThread, markAsRead } from '@/lib/api/messages';
import { useAuthStore } from '@/lib/store/authStore';
import type { Message } from '@/types/messageType';
import Modal from '@/components/UI/Modal/Modal';
import Button from '@/components/UI/Button/Button';
import ImageModal from '@/components/UI/ImageModal/ImageModal';
import Loader from '@/components/UI/Loader/Loader';
import ReplyForm from '../ReplyForm/ReplyForm';
import css from './MessageDetailModal.module.css';

interface MessageDetailModalProps {
  /** Any message in the conversation — the thread is fetched from it. */
  anchorId: string;
  /** Subject shown in the header (from the card that opened the modal). */
  subject?: string;
  currentUserId: string;
  onClose: () => void;
}

const formatFull = (
  value: string | undefined,
  locale: ReturnType<typeof getDateFnsLocale>,
  separator: string
) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  const datePart = format(parsed, 'dd MMMM yyyy', { locale });
  const timePart = format(parsed, 'HH:mm', { locale });
  return `${datePart} ${separator} ${timePart}`;
};

const authorIdOf = (m: Message) =>
  typeof m.authorId === 'object' && m.authorId
    ? String(m.authorId._id)
    : String(m.authorId);

const authorNameOf = (m: Message) =>
  typeof m.authorId === 'object' && m.authorId
    ? m.authorId.fullName
    : m.authorName;

const MessageDetailModal = ({
  anchorId,
  subject,
  currentUserId,
  onClose,
}: MessageDetailModalProps) => {
  const t = useTranslations('MessagesPage.detail');
  const tReply = useTranslations('MessagesPage.reply');
  const tMessages = useTranslations('MessagesPage.messages');
  const tRoles = useTranslations('Roles');
  const locale = getDateFnsLocale(useLocale());
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore(state => state.user?.role === 'admin');
  const myId = String(currentUserId);

  const [isReplying, setIsReplying] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Whole conversation the anchor belongs to (chat model), oldest-first.
  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: ['messageThread', anchorId],
    queryFn: () => getThread(anchorId),
    placeholderData: keepPreviousData,
  });
  const thread = threadData?.items ?? [];

  // Mark every message I received-but-haven't-read across the whole
  // conversation, so opening it clears the unread badge. Own messages are
  // skipped (the backend 403s "Not your message" for the author).
  const markedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!thread.length) return;
    const toMark = thread.filter(
      m => authorIdOf(m) !== myId && !m.readBy.includes(myId)
    );
    if (!toMark.length) return;
    // Guard against re-marking the same anchor render loop.
    const stamp = toMark.map(m => m._id).join(',');
    if (markedFor.current === stamp) return;
    markedFor.current = stamp;
    Promise.allSettled(toMark.map(m => markAsRead(m._id))).then(() => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadData]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: (_data, id) => {
      toast.success(tMessages('deleted'));
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      // Deleting the anchor makes the thread query 404 — just close.
      if (id === anchorId) {
        onClose();
      } else {
        queryClient.invalidateQueries({ queryKey: ['messageThread', anchorId] });
      }
    },
    onError: () => {
      toast.error(tMessages('deleteError'));
      setConfirmDeleteId(null);
    },
  });

  // Reply targets the most recent message NOT written by me — the backend
  // rejects replying to your own message.
  const replyTarget = [...thread]
    .reverse()
    .find(m => authorIdOf(m) !== myId);

  const canDelete = (m: Message) => authorIdOf(m) === myId || isAdmin;

  const destinationLabel = (m: Message) => {
    if (m.type === 'direct') return null;
    if (m.type === 'broadcast_all') return t('broadcastAll');
    return t('broadcastRole', {
      role: m.targetRole ? tRoles(m.targetRole) : '—',
    });
  };

  return (
    <>
      <Modal onClose={onClose}>
        <div className={css.wrap}>
          <h2 className={css.title}>{t('title')}</h2>

          {subject && <h3 className={css.subject}>{subject}</h3>}

          {threadLoading && !threadData ? (
            <div className={css.threadLoading}>
              <Loader />
            </div>
          ) : (
            <ul className={css.thread}>
              {thread.map(m => {
                const mine = authorIdOf(m) === myId;
                const dest = destinationLabel(m);
                // A lone message (no conversation yet) fills the whole
                // width like the original detail view; once there are
                // replies, messages split into left/right chat bubbles.
                const single = thread.length === 1;
                return (
                  <li
                    key={m._id}
                    className={`${css.bubble} ${
                      single
                        ? css.bubbleFull
                        : mine
                          ? css.bubbleMine
                          : css.bubbleTheirs
                    }`}
                  >
                    <div className={css.bubbleHead}>
                      <span className={css.bubbleAuthor}>
                        {mine ? t('you') : authorNameOf(m)} ·{' '}
                        {tRoles(m.authorRole)}
                      </span>
                      <div className={css.bubbleHeadRight}>
                        <span className={css.bubbleDate}>
                          {formatFull(m.createdAt, locale, t('dateSeparator'))}
                        </span>
                        {canDelete(m) && (
                          <button
                            type="button"
                            className={css.bubbleDelete}
                            aria-label={t('delete')}
                            title={t('delete')}
                            onClick={() =>
                              setConfirmDeleteId(
                                confirmDeleteId === m._id ? null : m._id
                              )
                            }
                          >
                            <svg width="17" height="17" aria-hidden="true">
                              <use href="/sprite.svg#close" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {dest && <span className={css.bubbleDest}>{dest}</span>}

                    <div className={css.bubbleBody}>{m.body}</div>

                    {m.img && m.img.length > 0 && (
                      <div className={css.imageGrid}>
                        {m.img.map((url, i) => (
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

                    {confirmDeleteId === m._id && (
                      <div className={css.confirmRow}>
                        <span className={css.confirmText}>
                          {t('deleteConfirm')}
                        </span>
                        <button
                          type="button"
                          className={css.confirmYes}
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(m._id)}
                        >
                          {t('deleteYes')}
                        </button>
                        <button
                          type="button"
                          className={css.confirmNo}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          {t('deleteNo')}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {isReplying && replyTarget ? (
            <div>
              <h4 className={css.replyTitle}>
                {tReply('title', { author: authorNameOf(replyTarget) })}
              </h4>
              <ReplyForm
                originalMessage={replyTarget}
                authorName={authorNameOf(replyTarget)}
                onSuccess={() => {
                  setIsReplying(false);
                  queryClient.invalidateQueries({
                    queryKey: ['messageThread', anchorId],
                  });
                  queryClient.invalidateQueries({ queryKey: ['messages'] });
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
              {replyTarget && (
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
        <ImageModal
          imageUrl={zoomedImage}
          onClose={() => setZoomedImage(null)}
        />
      )}
    </>
  );
};

export default MessageDetailModal;
