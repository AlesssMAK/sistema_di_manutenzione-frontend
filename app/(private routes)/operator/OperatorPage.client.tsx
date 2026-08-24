'use client';

import MessageInbox from '@/components/Messages/MessageInbox/MessageInbox';
import MyFaultsList from '@/components/Operator/MyFaultsList/MyFaultsList';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import { useAuthStore } from '@/lib/store/authStore';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import css from './OperatorPage.module.css';

type OperatorTab = 'messages' | 'myFaults';

const OperatorPageClient = () => {
  const t = useTranslations('OperatorPage');
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');

  const [activeTab, setActiveTab] = useState<OperatorTab>('messages');

  const tabs: TabItem<OperatorTab>[] = [
    { value: 'messages', label: t('tabs.messages'), icon: 'mail' },
    { value: 'myFaults', label: t('tabs.myFaults'), icon: 'alert-triangle' },
  ];

  return (
    <div className="container">
      <div className={css.page_wrapper}>
        <h2 className="title">{t('title')}</h2>
        <p className="subtitle">{t('subtitle')}</p>

        <div className={css.tabsBar}>
          <Tabs<OperatorTab>
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Operator's "Messaggi" mirrors what the bell links to —
            operators can't send/receive direct, so this is the
            broadcast_role view from /messages. */}
        {activeTab === 'messages' && (
          <MessageInbox kind="announcements" currentUserId={userId} />
        )}

        {activeTab === 'myFaults' && <MyFaultsList />}
      </div>
    </div>
  );
};

export default OperatorPageClient;
