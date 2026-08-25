'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useWarehouseAccess } from '@/lib/hooks/useWarehouseAccess';
import Button from '@/components/UI/Button/Button';
import Loader from '@/components/UI/Loader/Loader';
import WarehouseStock from '@/components/Warehouse/WarehouseStock/WarehouseStock';
import ItemsSection, {
  type ItemsSectionHandle,
} from '@/components/Warehouse/WarehouseCatalog/ItemsSection';
import css from './Warehouse.module.css';

const WarehouseClient = () => {
  const t = useTranslations('WarehousePage');
  const tBack = useTranslations('FaultDetail');
  const router = useRouter();
  const { canAccess, canManage, canOperate, isLoading } = useWarehouseAccess();
  // The catalog is a manage-only, occasional task — opened from a button
  // into its own full view (with a back button), not a tab or a modal.
  const [showCatalog, setShowCatalog] = useState(false);
  // The header "new item" button opens the form ItemsSection owns.
  const catalogRef = useRef<ItemsSectionHandle>(null);

  // The nav hides the link, but a direct URL still needs guarding: bounce
  // out once we know the module is off or the user has no grant.
  useEffect(() => {
    if (!isLoading && !canAccess) router.replace('/');
  }, [isLoading, canAccess, router]);

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
        {showCatalog && canManage ? (
          <>
            <div className={css.catalogHead}>
              <div className={css.catalogHeadLeft}>
                <button
                  type="button"
                  className={css.backButton}
                  onClick={() => setShowCatalog(false)}
                  title={tBack('backButton')}
                  aria-label={tBack('backButton')}
                >
                  <svg width="20" height="20" aria-hidden="true">
                    <use href="/sprite.svg#arrow_back_ios_new" />
                  </svg>
                </button>
                <div>
                  <h1 className="title">{t('tabs.catalog')}</h1>
                  <p className="subtitle">{t('catalogSubtitle')}</p>
                </div>
              </div>
              <Button
                type="button"
                className={`${css.catalogBtn} button button--blue`}
                onClick={() => catalogRef.current?.openNew()}
              >
                <svg width="16" height="16" className={css.btnIcon}>
                  <use href="/sprite.svg#plus" />
                </svg>
                {t('catalog.items.new')}
              </Button>
            </div>
            <ItemsSection ref={catalogRef} hideNewButton />
          </>
        ) : (
          <>
            <div className={css.header}>
              <div>
                <h1 className="title">{t('title')}</h1>
                <p className="subtitle">{t('subtitle')}</p>
              </div>
              {canManage && (
                <Button
                  type="button"
                  className={`${css.catalogBtn} button button--blue`}
                  onClick={() => setShowCatalog(true)}
                >
                  <svg width="16" height="16" className={css.btnIcon}>
                    <use href="/sprite.svg#clipboard" />
                  </svg>
                  {t('tabs.catalog')}
                </Button>
              )}
            </div>

            {canOperate && <WarehouseStock />}
          </>
        )}
      </div>
    </div>
  );
};

export default WarehouseClient;
