'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { getMovements } from '@/lib/api/warehouse';
import { useWarehouseAccess } from '@/lib/hooks/useWarehouseAccess';
import type { ItemRef, StockMovement } from '@/types/warehouseType';
import css from './FaultMaterialsUsed.module.css';

interface FaultMaterialsUsedProps {
  /** The fault's _id (movements reference it via reference.faultId). */
  faultId: string;
}

const itemName = (i: StockMovement['itemId']): string =>
  typeof i === 'string' ? i : (i as ItemRef).name;
const itemCode = (i: StockMovement['itemId']): string =>
  typeof i === 'string' ? '' : (i as ItemRef).code;
const unitCode = (i: StockMovement['itemId']): string => {
  if (typeof i === 'string') return '';
  const ref = i as ItemRef;
  return typeof ref.unitId === 'string' ? '' : ref.unitId.code;
};

// Materials actually issued from stock against this fault (out movements
// with reference.faultId). Self-hides when there are none, so it's safe
// to render on any fault detail page.
const FaultMaterialsUsed = ({ faultId }: FaultMaterialsUsedProps) => {
  const t = useTranslations('WarehousePage.stock');
  const { moduleEnabled } = useWarehouseAccess();

  const { data } = useQuery({
    queryKey: ['warehouse', 'movements', 'fault', faultId],
    queryFn: () => getMovements({ faultId, type: 'out', perPage: 100 }),
    enabled: moduleEnabled && Boolean(faultId),
  });

  const movements = data?.movements ?? [];
  if (movements.length === 0) return null;

  return (
    <div className={css.section}>
      <label className={css.label}>{t('materialsUsed')}</label>
      <ul className={css.list}>
        {movements.map(m => (
          <li key={m._id} className={css.row}>
            <span className={css.name}>
              {itemName(m.itemId)}
              <span className={css.code}> ({itemCode(m.itemId)})</span>
            </span>
            <span className={css.qty}>
              {m.quantity} {unitCode(m.itemId)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FaultMaterialsUsed;
