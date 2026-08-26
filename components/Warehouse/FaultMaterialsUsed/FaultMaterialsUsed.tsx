'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { getMovements } from '@/lib/api/warehouse';
import { useWarehouseAccess } from '@/lib/hooks/useWarehouseAccess';
import type { ItemRef, StockMovement } from '@/types/warehouseType';
import select from '@/components/UI/SelectDropdown/SelectDropdown.module.css';
import css from './FaultMaterialsUsed.module.css';

interface FaultMaterialsUsedProps {
  /** The fault's _id (movements reference it via reference.faultId). */
  faultId: string;
  /** Optional free-text material note captured in the finalize/suspend
   *  modal (fault.materialRequest). Shown at the bottom when present. */
  materialComment?: string;
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

// Collapsible "materials" panel for a fault detail, styled as the shared
// SelectDropdown (a closed box that expands) but used purely as a
// disclosure — no options to pick. Holds the items issued from stock
// (out movements with reference.faultId) and, at the bottom, the
// free-text material note from the finalize/suspend modal. The stock
// list needs the warehouse module; the note is independent. Self-hides
// when there's neither.
const FaultMaterialsUsed = ({
  faultId,
  materialComment,
}: FaultMaterialsUsedProps) => {
  const t = useTranslations('WarehousePage.stock');
  const { moduleEnabled } = useWarehouseAccess();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['warehouse', 'movements', 'fault', faultId],
    queryFn: () => getMovements({ faultId, type: 'out', perPage: 100 }),
    enabled: moduleEnabled && Boolean(faultId),
  });

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const movements = moduleEnabled ? (data?.movements ?? []) : [];
  const comment = materialComment?.trim();
  if (movements.length === 0 && !comment) return null;

  return (
    <div className={select.select_dropdown_container} ref={ref}>
      <div
        className={`${select.input} ${open ? select.active : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(o => !o);
          }
        }}
      >
        <span className={select.value}>
          {t('materialsUsed')}
          {movements.length > 0 ? ` (${movements.length})` : ''}
        </span>
        <svg
          width="16"
          height="16"
          className={`${select.arrow} ${open ? select.up : select.down}`}
        >
          <use href="/sprite.svg#arrow_back_ios_new" />
        </svg>
      </div>

      {open && (
        <div className={select.menu}>
          {movements.length > 0 && (
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
          )}

          {comment && (
            <div
              className={`${css.comment} ${movements.length > 0 ? css.commentDivided : ''}`}
            >
              <span className={css.commentLabel}>{t('materialNote')}</span>
              <p className={css.commentText}>{comment}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FaultMaterialsUsed;
