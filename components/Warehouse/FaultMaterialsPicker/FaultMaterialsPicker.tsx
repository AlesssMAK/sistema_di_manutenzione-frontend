'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { getAllItems } from '@/lib/api/warehouse';
import type {
  InventoryItem,
  MovementLine,
  Warehouse,
} from '@/types/warehouseType';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import { useWarehouseContext } from '@/lib/hooks/useWarehouseContext';
import css from './FaultMaterialsPicker.module.css';

export interface MaterialsPayload {
  warehouseId: string;
  lines: MovementLine[];
}

interface FaultMaterialsPickerProps {
  /** Reports the current selection (or null when nothing usable yet). */
  onChange: (data: MaterialsPayload | null) => void;
}

const itemLabel = (i: { name: string; code: string }) => `${i.name} (${i.code})`;

interface Line {
  key: number;
  itemId: string;
  itemText: string;
  quantity: string;
}

let seq = 0;

const FaultMaterialsPicker = ({ onChange }: FaultMaterialsPickerProps) => {
  const t = useTranslations('WarehousePage.stock');
  const tOp = useTranslations('WarehousePage.stock.op');

  const [warehouseId, setWarehouseId] = useState('');
  const [warehouseText, setWarehouseText] = useState('');
  // The confirmed list of materials to issue.
  const [lines, setLines] = useState<Line[]>([]);
  // The compose row (item + qty) awaiting the "add" button.
  const [draftItemId, setDraftItemId] = useState('');
  const [draftItemText, setDraftItemText] = useState('');
  const [draftQty, setDraftQty] = useState('');

  const { data: itemsData } = useQuery({
    queryKey: ['warehouse', 'items', 'active-pool'],
    queryFn: () => getAllItems({ status: 'active', perPage: 200 }),
  });
  // Fault write-offs draw from the maintenance warehouse set. When it
  // resolves to one warehouse the picker is hidden and it's used
  // implicitly.
  const {
    candidates: warehouses,
    single,
    showPicker,
  } = useWarehouseContext('maintenance');
  const items: InventoryItem[] = useMemo(
    () => itemsData?.items ?? [],
    [itemsData]
  );
  const whByLabel = useMemo(() => {
    const m = new Map<string, Warehouse>();
    warehouses.forEach(w => m.set(w.name, w));
    return m;
  }, [warehouses]);
  const itemByLabel = useMemo(() => {
    const m = new Map<string, InventoryItem>();
    items.forEach(i => m.set(itemLabel(i), i));
    return m;
  }, [items]);
  const itemById = useMemo(() => {
    const m = new Map<string, InventoryItem>();
    items.forEach(i => m.set(i._id, i));
    return m;
  }, [items]);

  // Auto-select the warehouse when the context resolves to a single one,
  // so materials never silently fail to issue because none was picked.
  useEffect(() => {
    if (!warehouseId && single) {
      setWarehouseId(single._id);
      setWarehouseText(single.name);
    }
  }, [single, warehouseId]);

  // Piece-like usage units stay integer; continuous ones allow decimals.
  const stepFor = (itemId: string): string => {
    const it = itemById.get(itemId);
    if (!it || typeof it.unitId === 'string') return 'any';
    return it.unitId.allowsDecimals ? 'any' : '1';
  };

  // Report a usable payload (warehouse + at least one valid line) or null.
  const emit = (whId: string, ls: Line[]) => {
    const valid: MovementLine[] = ls
      .filter(l => l.itemId && Number(l.quantity) > 0)
      .map(l => ({ itemId: l.itemId, quantity: Number(l.quantity) }));
    onChange(whId && valid.length ? { warehouseId: whId, lines: valid } : null);
  };

  const selectWarehouse = (label: string) => {
    const w = whByLabel.get(label);
    if (!w) return;
    setWarehouseId(w._id);
    setWarehouseText(label);
    emit(w._id, lines);
  };

  // Add the composed item+qty to the list, then clear the compose row.
  // Same item added twice merges into the existing line.
  const addDraft = () => {
    if (!draftItemId || Number(draftQty) <= 0) {
      toast.error(tOp('addAtLeastOne'));
      return;
    }
    const existing = lines.find(l => l.itemId === draftItemId);
    const next = existing
      ? lines.map(l =>
          l.key === existing.key
            ? { ...l, quantity: String(Number(l.quantity) + Number(draftQty)) }
            : l
        )
      : [
          ...lines,
          {
            key: ++seq,
            itemId: draftItemId,
            itemText: draftItemText,
            quantity: draftQty,
          },
        ];
    setLines(next);
    setDraftItemId('');
    setDraftItemText('');
    setDraftQty('');
    emit(warehouseId, next);
  };

  const patchQty = (key: number, quantity: string) => {
    const next = lines.map(l => (l.key === key ? { ...l, quantity } : l));
    setLines(next);
    emit(warehouseId, next);
  };

  const removeLine = (key: number) => {
    const next = lines.filter(l => l.key !== key);
    setLines(next);
    emit(warehouseId, next);
  };

  return (
    <div className={css.wrap}>
      {/* Warehouse picker only when the maintenance context is ambiguous
          (more than one candidate); otherwise the single one is implicit. */}
      {showPicker && (
        <SelectDropdown
          options={warehouses.map(w => w.name)}
          selectedValue={warehouseText}
          placeholder={t('selectWarehouse')}
          onSelect={selectWarehouse}
        />
      )}

      {showPicker && lines.length > 0 && !warehouseId && (
        <p className={css.warn}>{tOp('selectWarehouseFirst')}</p>
      )}

      {/* Compose row: pick an item + quantity, then "+" pushes it to the
          list below. */}
      <div className={css.composeRow}>
        <div className={css.composeItem}>
          <SelectDropdown
            options={items.map(itemLabel)}
            selectedValue={draftItemText}
            placeholder={tOp('itemPlaceholder')}
            onSelect={label => {
              const i = itemByLabel.get(label);
              if (i) {
                setDraftItemId(i._id);
                setDraftItemText(label);
              }
            }}
          />
        </div>
        <input
          className={css.qty}
          type="number"
          min={0}
          step={draftItemId ? stepFor(draftItemId) : 'any'}
          placeholder={tOp('qty')}
          value={draftQty}
          onChange={e => setDraftQty(e.target.value)}
        />
        <button
          type="button"
          className={css.addBtn}
          onClick={addDraft}
          aria-label={tOp('add')}
          title={tOp('add')}
        >
          <svg>
            <use href="/sprite.svg#plus" />
          </svg>
        </button>
      </div>

      {lines.length === 0 ? (
        <p className={css.empty}>{tOp('noMaterials')}</p>
      ) : (
        <ul className={css.list}>
          {lines.map(l => (
            <li key={l.key} className={css.listRow}>
              <span className={css.listName}>{l.itemText}</span>
              <input
                className={css.listQty}
                type="number"
                min={0}
                step={stepFor(l.itemId)}
                value={l.quantity}
                onChange={e => patchQty(l.key, e.target.value)}
              />
              <button
                type="button"
                className={css.removeBtn}
                onClick={() => removeLine(l.key)}
                aria-label={tOp('remove')}
                title={tOp('remove')}
              >
                <svg>
                  <use href="/sprite.svg#delete" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FaultMaterialsPicker;
