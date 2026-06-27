'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Message } from '@/types/messageType';
import { useAuthStore } from '@/lib/store/authStore';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import MessageCard from '@/components/Messages/MessageCard/MessageCard';
import MessageDetailModal from '@/components/Messages/MessageDetailModal/MessageDetailModal';
import css from './BroadcastsList.module.css';

interface BroadcastsListProps {
  /** Already-fetched + filtered announcements (owned by the page). */
  items: Message[];
  isLoading: boolean;
  isError: boolean;
}

const BroadcastsList = ({ items, isLoading, isError }: BroadcastsListProps) => {
  const t = useTranslations('reportsAndCommunicationsPage');
  const tNoFound = useTranslations('NoFound');
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');
  const [openMessage, setOpenMessage] = useState<Message | null>(null);

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
