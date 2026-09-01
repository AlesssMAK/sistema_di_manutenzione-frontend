'use client';

import ComposeMessageModal from '@/components/Messages/ComposeMessageModal/ComposeMessageModal';
import MessageInbox, {
  type InboxKind,
} from '@/components/Messages/MessageInbox/MessageInbox';
import Button from '@/components/UI/Button/Button';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import { useAuthStore } from '@/lib/store/authStore';
import { getUnreadCount } from '@/lib/api/messages';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import css from './page.module.css';

const MessagesClient = () => {
  const t = useTranslations('MessagesPage');
  const tDetail = useTranslations('FaultDetail');
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  const isOperator = user?.role === 'operator';
  const [activeTab, setActiveTab] = useState<InboxKind>('direct');
  const [composeOpen, setComposeOpen] = useState(false);

  // Receiving is open to everyone (both tabs show). Sending is the only
  // restriction: an operator may send direct only when granted the
  // permission (and never broadcasts); other roles get all three channels.
  const canSendDirect =
    !isOperator || user?.permissions?.canSendMessages === true;
  const allowedChannels: Array<'direct' | 'broadcastAll' | 'broadcastRole'> =
    isOperator
      ? canSendDirect
        ? ['direct']
        : []
      : ['direct', 'broadcastRole', 'broadcastAll'];
  const canCompose = allowedChannels.length > 0;

  // Operators without the send permission have no use for this page — they
  // read direct messages on their dashboard and announcements on the Bacheca.
  // Bounce them back to their dashboard.
  const blocked = isOperator && !canSendDirect;
  useEffect(() => {
    if (blocked) router.replace('/operator');
  }, [blocked, router]);

  // Both tabs are shown to every role now — operators included.
  const tabs = useMemo<TabItem<InboxKind>[]>(
    () => [
      { value: 'direct', label: t('tabs.direct'), icon: 'mail' },
      { value: 'announcements', label: t('tabs.announcements'), icon: 'megaphone' },
    ],
    [t]
  );

  // Unread badges on the tabs — the count blinks with a red border when
  // there's something new (hidden at zero).
  const { data: unread } = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: getUnreadCount,
    staleTime: 30 * 1000,
  });
  const unreadDirect = unread?.direct ?? 0;
  const unreadAnnouncements =
    (unread?.roleAnnouncements ?? 0) + (unread?.allAnnouncements ?? 0);
  const tabCounts: Partial<Record<InboxKind, number>> = {
    ...(unreadDirect > 0 ? { direct: unreadDirect } : {}),
    ...(unreadAnnouncements > 0 ? { announcements: unreadAnnouncements } : {}),
  };
  const tabDots: Partial<Record<InboxKind, boolean>> = {
    ...(unreadDirect > 0 ? { direct: true } : {}),
    ...(unreadAnnouncements > 0 ? { announcements: true } : {}),
  };

  if (blocked) return null;

  return (
    <div className="container">
      <div className={css.page_wrapper}>
        {/* Header row mirrors the admin user-list pattern: title +
            subtitle on the left, primary action button on the right
            (drops below on phone via the head_container breakpoint). */}
        <div className={css.head_container}>
          <div className={css.header_left}>
            <button
              type="button"
              className={css.backButton}
              onClick={() => router.back()}
              title={tDetail('backButton')}
              aria-label={tDetail('backButton')}
            >
              <svg width="20" height="20" aria-hidden="true">
                <use href="/sprite.svg#arrow_back_ios_new" />
              </svg>
            </button>
            <div className={css.title_container}>
              <h2 className="title">{t('title')}</h2>
              <p className="subtitle">{t('subtitle')}</p>
            </div>
          </div>
          {canCompose && (
            <Button
              type="button"
              className={`${css.btn} button button--blue`}
              onClick={() => setComposeOpen(true)}
            >
              <svg width="16" height="16" className={css.btn_icon}>
                <use href="/sprite.svg#plus"></use>
              </svg>
              {t('compose.openButton')}
            </Button>
          )}
        </div>

        <div className={css.tabsBar}>
          <Tabs<InboxKind>
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={tabCounts}
            dots={tabDots}
          />
        </div>

        <MessageInbox kind={activeTab} currentUserId={userId} />

        {composeOpen && (
          <ComposeMessageModal
            currentUserId={userId}
            allowedChannels={allowedChannels}
            onClose={() => setComposeOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MessagesClient;
