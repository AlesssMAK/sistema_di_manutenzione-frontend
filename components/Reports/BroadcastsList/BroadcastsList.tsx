'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { getAnnouncements } from '@/lib/api/messages';
import type { Message } from '@/types/messageType';
import { useAuthStore } from '@/lib/store/authStore';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import MessageCard from '@/components/Messages/MessageCard/MessageCard';
import MessageDetailModal from '@/components/Messages/MessageDetailModal/MessageDetailModal';
import css from './BroadcastsList.module.css';

const PER_PAGE = 20;

const BroadcastsList = () => {
  const t = useTranslations('reportsAndCommunicationsPage');
  const tNoFound = useTranslations('NoFound');
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');
  const [openMessage, setOpenMessage] = useState<Message | null>(null);

  // Pull both broadcast types in a single request — backend default when
  // ?types= is omitted is exactly broadcast_all + broadcast_role-for-my-role.
  // We then label each card with the right badge so the user knows whether
  // the message went to everyone or just to their role.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['messages', 'broadcasts-all-and-role'],
    queryFn: () => getAnnouncements({ page: 1, perPage: PER_PAGE }),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className={css.loadingWrap}>
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <NoFound
        title={tNoFound('serverErrorTitle')}
        message={t('errors.loadBroadcasts')}
      />
    );
  }

  if (items.length === 0) {
    return (
      <NoFound
        title={tNoFound('noResultsTitle')}
        message={t('sections.broadcasts.empty')}
      />
    );
  }

  return (
    <div className={css.wrap}>
      <ul className={css.list}>
        {items.map(msg => (
          <div key={msg._id} className={css.cardWrap}>
            <span
              className={`${css.badge} ${
                msg.type === 'broadcast_all' ? css.badgeAll : css.badgeRole
              }`}
            >
              {msg.type === 'broadcast_all'
                ? t('broadcastBadge.all')
                : t('broadcastBadge.role')}
            </span>
            <MessageCard
              message={msg}
              currentUserId={userId}
              onClick={setOpenMessage}
            />
          </div>
        ))}
      </ul>

      {openMessage && (
        <MessageDetailModal
          message={openMessage}
          currentUserId={userId}
          onClose={() => setOpenMessage(null)}
        />
      )}
    </div>
  );
};

export default BroadcastsList;
