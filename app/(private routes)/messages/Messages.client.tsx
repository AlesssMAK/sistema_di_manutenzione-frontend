'use client';

import ComposeMessageModal from '@/components/Messages/ComposeMessageModal/ComposeMessageModal';
import MessageInbox, {
  type InboxKind,
} from '@/components/Messages/MessageInbox/MessageInbox';
import Button from '@/components/UI/Button/Button';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import { useAuthStore } from '@/lib/store/authStore';
import { usePageStore } from '@/lib/store/pageStore';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import css from './page.module.css';

const MessagesClient = () => {
  const t = useTranslations('MessagesPage');
  const tDetail = useTranslations('FaultDetail');
  const router = useRouter();
  const setPageTitle = usePageStore(state => state.setPageTitle);
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  const isOperator = user?.role === 'operator';
  const [activeTab, setActiveTab] = useState<InboxKind>('direct');
  const [composeOpen, setComposeOpen] = useState(false);

  // Operators now have a direct inbox too (BE opened it), but they
  // only send person-to-person — no broadcasts. Other roles get all
  // three channels; the backend still enforces per-channel rules.
  const allowedChannels: Array<'direct' | 'broadcastAll' | 'broadcastRole'> =
    isOperator ? ['direct'] : ['direct', 'broadcastRole', 'broadcastAll'];
  const canCompose = allowedChannels.length > 0;

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, [setPageTitle, t]);

  // Both tabs are shown to every role now — operators included.
  const tabs = useMemo<TabItem<InboxKind>[]>(
    () => [
      { value: 'direct', label: t('tabs.direct') },
      { value: 'announcements', label: t('tabs.announcements') },
    ],
    [t]
  );

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
