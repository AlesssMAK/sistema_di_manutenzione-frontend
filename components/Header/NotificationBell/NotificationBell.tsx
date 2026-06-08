'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { getUnreadCount } from '@/lib/api/messages';
import css from './NotificationBell.module.css';

const POLL_INTERVAL_MS = 30_000;

interface NotificationBellProps {
  /**
   * Gate polling — pass `isAuthenticated` so we don't spam /unread-count
   * with 401s for logged-out viewers.
   */
  enabled: boolean;
}

const NotificationBell = ({ enabled }: NotificationBellProps) => {
  const router = useRouter();
  const t = useTranslations('header.notifications');

  const { data } = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: getUnreadCount,
    enabled,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  // Bell surfaces only personal channels: direct mail + broadcasts pinned
  // to my role. Broadcast-to-all goes to the /reports-and-communications
  // dashboard instead — it'd swamp the badge otherwise.
  const total = (data?.direct ?? 0) + (data?.roleAnnouncements ?? 0);
  const display = total > 9 ? '9+' : String(total);

  return (
    <button
      type="button"
      className={css.bell}
      onClick={() => router.push('/messages')}
      aria-label={t('ariaLabel')}
      title={t('tooltip')}
    >
      <svg className={css.icon} width="20" height="20" aria-hidden="true">
        <use href="/sprite.svg#mail" />
      </svg>
      {total > 0 && <span className={css.badge}>{display}</span>}
    </button>
  );
};

export default NotificationBell;
