'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { getAnnouncements, getConversations } from '@/lib/api/messages';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import MessageCard from '../MessageCard/MessageCard';
import ConversationCard from '../ConversationCard/ConversationCard';
import MessageDetailModal from '../MessageDetailModal/MessageDetailModal';
import css from './MessageInbox.module.css';

export type InboxKind = 'direct' | 'announcements';

interface MessageInboxProps {
  kind: InboxKind;
  currentUserId: string;
}

const PER_PAGE = 10;

const MessageInbox = ({ kind, currentUserId }: MessageInboxProps) => {
  const t = useTranslations('MessagesPage');
  const tNoFound = useTranslations('NoFound');
  const [page, setPage] = useState(1);
  const [openAnchor, setOpenAnchor] = useState<{
    id: string;
    subject: string;
  } | null>(null);

  const isDirect = kind === 'direct';

  // Two separate queries (only the active one runs) — direct is the
  // chat-list of conversations, announcements are role-targeted broadcasts.
  const conversationsQuery = useQuery({
    queryKey: ['messages', 'direct', page],
    queryFn: () => getConversations({ page, perPage: PER_PAGE }),
    placeholderData: keepPreviousData,
    enabled: isDirect,
  });

  const announcementsQuery = useQuery({
    queryKey: ['messages', 'announcements', page],
    queryFn: () =>
      getAnnouncements({ types: ['broadcast_role'], page, perPage: PER_PAGE }),
    placeholderData: keepPreviousData,
    enabled: !isDirect,
  });

  const activeQuery = isDirect ? conversationsQuery : announcementsQuery;
  const { isLoading, isError } = activeQuery;
  const conversations = conversationsQuery.data?.items ?? [];
  const announcements = announcementsQuery.data?.items ?? [];
  const totalPages = activeQuery.data?.totalPages ?? 0;
  const isEmpty = isDirect
    ? conversations.length === 0
    : announcements.length === 0;

  return (
    <div className={css.wrap}>
      {isLoading ? (
        <div className={css.loadingWrap}>
          <Loader />
        </div>
      ) : isError ? (
        <NoFound
          title={tNoFound('serverErrorTitle')}
          message={t('errors.load')}
        />
      ) : isEmpty ? (
        <NoFound
          title={tNoFound('noResultsTitle')}
          message={t(`empty.${kind}`)}
        />
      ) : (
        <ul className={css.list}>
          {isDirect
            ? conversations.map(conv => (
                <ConversationCard
                  key={conv.threadId}
                  conversation={conv}
                  currentUserId={currentUserId}
                  onOpen={c =>
                    setOpenAnchor({ id: c.last._id, subject: c.last.subject })
                  }
                />
              ))
            : announcements.map(msg => (
                <MessageCard
                  key={msg._id}
                  message={msg}
                  currentUserId={currentUserId}
                  onClick={m =>
                    setOpenAnchor({ id: m._id, subject: m.subject })
                  }
                />
              ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className={css.paginationWrap}>
          <Pagination
            totalPages={totalPages}
            page={page}
            onPageChange={setPage}
          />
        </div>
      )}

      {openAnchor && (
        <MessageDetailModal
          anchorId={openAnchor.id}
          subject={openAnchor.subject}
          currentUserId={currentUserId}
          onClose={() => setOpenAnchor(null)}
        />
      )}
    </div>
  );
};

export default MessageInbox;
