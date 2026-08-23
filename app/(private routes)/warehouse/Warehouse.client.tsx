'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useWarehouseAccess } from '@/lib/hooks/useWarehouseAccess';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import Loader from '@/components/UI/Loader/Loader';
import WarehouseStock from '@/components/Warehouse/WarehouseStock/WarehouseStock';
import ItemsSection from '@/components/Warehouse/WarehouseCatalog/ItemsSection';
import css from './Warehouse.module.css';

type WarehouseTab = 'stock' | 'catalog';

const WarehouseClient = () => {
  const t = useTranslations('WarehousePage');
  const router = useRouter();
  const { canAccess, canManage, canOperate, isLoading } = useWarehouseAccess();

  // The nav hides the link, but a direct URL still needs guarding: bounce
  // out once we know the module is off or the user has no grant.
  useEffect(() => {
    if (!isLoading && !canAccess) router.replace('/');
  }, [isLoading, canAccess, router]);

  const tabs = useMemo<TabItem<WarehouseTab>[]>(() => {
    const list: TabItem<WarehouseTab>[] = [];
    if (canOperate) list.push({ value: 'stock', label: t('tabs.stock') });
    if (canManage) list.push({ value: 'catalog', label: t('tabs.catalog') });
    return list;
  }, [canOperate, canManage, t]);

  const [selectedTab, setSelectedTab] = useState<WarehouseTab>('stock');

  // Derive the effective tab during render so it stays valid for the
  // granted permissions without a state-syncing effect.
  const activeTab: WarehouseTab = tabs.some(tab => tab.value === selectedTab)
    ? selectedTab
    : (tabs[0]?.value ?? 'stock');

  if (isLoading || !canAccess) {
    return (
      <div className="section">
        <div className="container">
          <div className={css.loaderWrap}>
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <div className={css.header}>
          <h1 className="title">{t('title')}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>

        {tabs.length > 1 && (
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setSelectedTab}
          />
        )}

        <div className={css.tabContent}>
          {activeTab === 'stock' && canOperate && <WarehouseStock />}
          {activeTab === 'catalog' && canManage && <ItemsSection />}
        </div>
      </div>
    </div>
  );
};

export default WarehouseClient;
