'use client';

import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { usePushNotifications } from '@/lib/push/usePushNotifications';
import css from './PushToggle.module.css';

const PushToggle = () => {
  const t = useTranslations('header.push');
  const { supported, permission, isSubscribed, busy, subscribe, unsubscribe } =
    usePushNotifications();

  // Browsers without the Push API (or iOS Safari pre-PWA) — hide it.
  if (!supported) return null;

  const onClick = async () => {
    if (busy) return;

    if (permission === 'denied') {
      toast.error(t('blocked'));
      return;
    }

    if (isSubscribed) {
      await unsubscribe();
      toast.success(t('disabled'));
      return;
    }

    const ok = await subscribe();
    if (ok) {
      toast.success(t('enabled'));
    } else if (Notification.permission === 'denied') {
      toast.error(t('blocked'));
    } else {
      toast.error(t('error'));
    }
  };

  return (
    <button
      type="button"
      className={`${css.btn} ${isSubscribed ? css.active : ''}`}
      onClick={onClick}
      disabled={busy}
      title={isSubscribed ? t('on') : t('off')}
      aria-label={isSubscribed ? t('on') : t('off')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={css.icon}
        aria-hidden
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        {!isSubscribed && <line x1="3" y1="3" x2="21" y2="21" />}
      </svg>
    </button>
  );
};

export default PushToggle;
