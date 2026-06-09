'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { getAnnouncements, getInbox } from '@/lib/api/messages';
import type { Message } from '@/types/messageType';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import MessageCard from '../MessageCard/MessageCard';
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
  const [openMessage, setOpenMessage] = useState<Message | null>(null);

  // Bell drives bubble counts; this view only fetches a role-targeted list
  // so users see what's relevant to them (broadcast_all lives on
  // /reports-and-communications, per the channel split decision).
  const { data, isLoading, isError } = useQuery({
    queryKey: ['messages', kind, page],
    queryFn: () =>
      kind === 'direct'
        ? getInbox({ box: 'inbox', page, perPage: PER_PAGE })
        : getAnnouncements({
            types: ['broadcast_role'],
            page,
            perPage: PER_PAGE,
          }),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

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
      ) : items.length === 0 ? (
        <NoFound
          title={tNoFound('noResultsTitle')}
          message={t(`empty.${kind}`)}
        />
      ) : (
        <ul className={css.list}>
          {items.map(msg => (
            <MessageCard
              key={msg._id}
              message={msg}
              currentUserId={currentUserId}
              onClick={setOpenMessage}
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

      {openMessage && (
        <MessageDetailModal
          message={openMessage}
          currentUserId={currentUserId}
          onClose={() => setOpenMessage(null)}
        />
      )}
    </div>
  );
};

export default MessageInbox;
