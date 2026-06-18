'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePageStore } from '@/lib/store/pageStore';
import { useAuthStore } from '@/lib/store/authStore';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import MessageInbox, {
  type InboxKind,
} from '@/components/Messages/MessageInbox/MessageInbox';
import ComposeMessageModal from '@/components/Messages/ComposeMessageModal/ComposeMessageModal';
import css from './page.module.css';

const MessagesClient = () => {
  const t = useTranslations('MessagesPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  // Operators have no direct inbox (backend gates it), so default to
  // announcements for them and hide the Direct tab entirely.
  const isOperator = user?.role === 'operator';
  const [activeTab, setActiveTab] = useState<InboxKind>(
    isOperator ? 'announcements' : 'direct'
  );
  const [composeOpen, setComposeOpen] = useState(false);

  // BE blocks operators from sending direct messages and broadcasts
  // are also out of their scope — hide the compose entry point
  // entirely for them. Everyone else gets all three channels; the
  // backend still enforces per-channel rules.
  const allowedChannels: Array<'direct' | 'broadcastAll' | 'broadcastRole'> =
    isOperator ? [] : ['direct', 'broadcastRole', 'broadcastAll'];
  const canCompose = allowedChannels.length > 0;

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, [setPageTitle, t]);

  const tabs = useMemo<TabItem<InboxKind>[]>(() => {
    const all: TabItem<InboxKind>[] = [
      { value: 'direct', label: t('tabs.direct') },
      { value: 'announcements', label: t('tabs.announcements') },
    ];
    return isOperator ? all.filter(tab => tab.value !== 'direct') : all;
  }, [t, isOperator]);

  return (
    <div className="container">
      <div className={css.pageWrapper}>
        <h2 className="title">{t('title')}</h2>
        <p className="subtitle">{t('subtitle')}</p>

        <div className={css.toolbar}>
          <div className={css.tabsBar}>
            <Tabs<InboxKind>
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
          {canCompose && (
            <button
              type="button"
              className={css.composeButton}
              onClick={() => setComposeOpen(true)}
            >
              {t('compose.openButton')}
            </button>
          )}
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
