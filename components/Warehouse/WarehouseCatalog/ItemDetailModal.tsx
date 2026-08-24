'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { getStock } from '@/lib/api/warehouse';
import type { InventoryItem, StockLevel, WarehouseRef } from '@/types/warehouseType';
import Button from '@/components/UI/Button/Button';
import Modal from '@/components/UI/Modal/Modal';
import Loader from '@/components/UI/Loader/Loader';
import css from './Catalog.module.css';

interface ItemDetailModalProps {
  item: InventoryItem;
  labelsEnabled: boolean;
  onClose: () => void;
  onEdit: () => void;
  onLabel: () => void;
}

const warehouseName = (w: StockLevel['warehouseId']): string =>
  typeof w === 'string' ? w : (w as WarehouseRef).name;

const ItemDetailModal = ({
  item,
  labelsEnabled,
  onClose,
  onEdit,
  onLabel,
}: ItemDetailModalProps) => {
  const t = useTranslations('WarehousePage.catalog.items');
  const tCommon = useTranslations('WarehousePage.catalog.common');
  const tStock = useTranslations('WarehousePage.stock');
  const tQr = useTranslations('WarehousePage.qr');

  const unit = typeof item.unitId === 'string' ? null : item.unitId;
  const hasPackage = Boolean(item.unitsPerPackage && item.unitsPerPackage > 0);

  const { data, isLoading } = useQuery({
    queryKey: ['warehouse', 'stock', 'item', item._id],
    queryFn: () => getStock({ itemId: item._id, perPage: 200 }),
  });
  const levels = data?.levels ?? [];

  return (
    <Modal onClose={onClose}>
      <div className={css.card}>
        <div>
          <h2 className={`${css.formTitle} title`}>
            {item.name}
            <span className={css.rowCode}>({item.code})</span>
          </h2>
        </div>

        <dl className={css.detail}>
          {unit && (
            <div className={css.detailRow}>
              <dt className={css.detailKey}>{t('fields.unit')}</dt>
              <dd className={css.detailVal}>
                {unit.name} ({unit.code})
              </dd>
            </div>
          )}
          <div className={css.detailRow}>
            <dt className={css.detailKey}>{t('card.decimals')}</dt>
            <dd className={css.detailVal}>
              {unit?.allowsDecimals ? t('card.yes') : t('card.no')}
            </dd>
          </div>
          {hasPackage && (
            <div className={css.detailRow}>
              <dt className={css.detailKey}>{t('fields.packageLabel')}</dt>
              <dd className={css.detailVal}>
                {item.packageLabel} × {item.unitsPerPackage}
              </dd>
            </div>
          )}
          {item.category && (
            <div className={css.detailRow}>
              <dt className={css.detailKey}>{t('fields.category')}</dt>
              <dd className={css.detailVal}>{item.category}</dd>
            </div>
          )}
          {item.note && (
            <div className={css.detailRow}>
              <dt className={css.detailKey}>{t('fields.note')}</dt>
              <dd className={css.detailVal}>{item.note}</dd>
            </div>
          )}
        </dl>

        <div>
          <p className={css.stockTitle}>{t('card.stockTitle')}</p>
          {isLoading ? (
            <div className={css.loaderWrap}>
              <Loader />
            </div>
          ) : levels.length === 0 ? (
            <p className={css.hint}>{t('card.noStock')}</p>
          ) : (
            <div className={css.stockTableWrap}>
              <table className={css.stockTable}>
                <thead>
                  <tr>
                    <th>{t('card.warehouse')}</th>
                    <th>{tStock('table.quantity')}</th>
                    <th>{tStock('table.min')}</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map(lvl => {
                    const low = lvl.quantity <= lvl.minLevel;
                    return (
                      <tr key={lvl._id}>
                        <td>{warehouseName(lvl.warehouseId)}</td>
                        <td>
                          <span className={low ? css.qtyLow : ''}>
                            {lvl.quantity}
                          </span>
                          {hasPackage && item.unitsPerPackage && (
                            <span className={css.stockPkg}>
                              {' '}
                              ≈{' '}
                              {Math.round(
                                (lvl.quantity / item.unitsPerPackage) * 10
                              ) / 10}{' '}
                              {item.packageLabel}
                            </span>
                          )}
                          {low && (
                            <span className={css.lowBadge}>{tStock('low')}</span>
                          )}
                        </td>
                        <td>{lvl.minLevel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={css.formActions}>
          {labelsEnabled && (
            <Button
              type="button"
              className="button button--white"
              width="100%"
              onClick={onLabel}
            >
              {tQr('labelBtn')}
            </Button>
          )}
          <Button
            type="button"
            className="button button--blue"
            width="100%"
            onClick={onEdit}
          >
            {tCommon('edit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ItemDetailModal;
