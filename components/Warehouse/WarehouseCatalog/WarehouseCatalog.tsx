'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Tabs, { type TabItem } from '@/components/UI/Tabs/Tabs';
import ItemsSection from './ItemsSection';
import WarehousesSection from './WarehousesSection';
import UnitsSection from './UnitsSection';

type CatalogTab = 'items' | 'warehouses' | 'units';

const WarehouseCatalog = () => {
  const t = useTranslations('WarehousePage.catalog');
  const [tab, setTab] = useState<CatalogTab>('items');

  const tabs: TabItem<CatalogTab>[] = [
    { value: 'items', label: t('tabs.items') },
    { value: 'warehouses', label: t('tabs.warehouses') },
    { value: 'units', label: t('tabs.units') },
  ];

  return (
    <div>
      <Tabs tabs={tabs} activeTab={tab} onTabChange={setTab} />
      {tab === 'items' && <ItemsSection />}
      {tab === 'warehouses' && <WarehousesSection />}
      {tab === 'units' && <UnitsSection />}
    </div>
  );
};

export default WarehouseCatalog;
