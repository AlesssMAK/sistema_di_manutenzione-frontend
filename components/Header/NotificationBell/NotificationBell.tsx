'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { getUnreadCount } from '@/lib/api/messages';
import css from './NotificationBell.module.css';

const POLL_INTERVAL_MS = 30_000;

interface NotificationBellProps {
  enabled: boolean;
  onClose?: () => void;
}

const NotificationBell = ({ enabled, onClose }: NotificationBellProps) => {
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

  const total = (data?.direct ?? 0) + (data?.roleAnnouncements ?? 0);
  const display = total > 9 ? '9+' : String(total);

  return (
    <button
      type="button"
      className={css.bell}
      onClick={() => {
        (router.push('/messages'), onClose?.());
      }}
      aria-label={t('ariaLabel')}
      title={t('tooltip')}
    >
      <svg className={css.icon} width="22" height="22" aria-hidden="true">
        <use href="/sprite.svg#mail" />
      </svg>
      {total > 0 && <span className={css.badge}>{display}</span>}
    </button>
  );
};

export default NotificationBell;
