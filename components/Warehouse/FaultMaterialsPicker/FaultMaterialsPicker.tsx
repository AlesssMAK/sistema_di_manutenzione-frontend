'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  getAllItems,
  getAllWarehouses,
  getItemByCode,
} from '@/lib/api/warehouse';
import type {
  InventoryItem,
  MovementLine,
  Warehouse,
} from '@/types/warehouseType';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import QrScannerModal from '@/components/Warehouse/QrScannerModal/QrScannerModal';
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

interface DraftLine {
  key: number;
  itemId: string;
  itemText: string;
  quantity: string;
}

let seq = 0;
const emptyLine = (): DraftLine => ({
  key: ++seq,
  itemId: '',
  itemText: '',
  quantity: '',
});

const FaultMaterialsPicker = ({ onChange }: FaultMaterialsPickerProps) => {
  const t = useTranslations('WarehousePage.stock');
  const tOp = useTranslations('WarehousePage.stock.op');

  const [warehouseId, setWarehouseId] = useState('');
  const [warehouseText, setWarehouseText] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [scanning, setScanning] = useState(false);

  const { data: whData } = useQuery({
    queryKey: ['warehouse', 'warehouses', 'active-pool'],
    queryFn: () => getAllWarehouses({ status: 'active', perPage: 200 }),
  });
  const { data: itemsData } = useQuery({
    queryKey: ['warehouse', 'items', 'active-pool'],
    queryFn: () => getAllItems({ status: 'active', perPage: 200 }),
  });
  const warehouses: Warehouse[] = useMemo(
    () => whData?.warehouses ?? [],
    [whData]
  );
  const items: InventoryItem[] = useMemo(
    () => itemsData?.items ?? [],
    [itemsData]
  );
  const whByLabel = useMemo(() => {
    const m = new Map<string, Warehouse>();
    warehouses.forEach((w) => m.set(w.name, w));
    return m;
  }, [warehouses]);
  const itemByLabel = useMemo(() => {
    const m = new Map<string, InventoryItem>();
    items.forEach((i) => m.set(itemLabel(i), i));
    return m;
  }, [items]);

  // Report a usable payload (warehouse + at least one valid line) or null.
  const emit = (whId: string, ls: DraftLine[]) => {
    const valid: MovementLine[] = ls
      .filter((l) => l.itemId && Number(l.quantity) > 0)
      .map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) }));
    onChange(whId && valid.length ? { warehouseId: whId, lines: valid } : null);
  };

  const selectWarehouse = (label: string) => {
    const w = whByLabel.get(label);
    if (!w) return;
    setWarehouseId(w._id);
    setWarehouseText(label);
    emit(w._id, lines);
  };

  const patchLine = (key: number, patch: Partial<DraftLine>) => {
    const next = lines.map((l) => (l.key === key ? { ...l, ...patch } : l));
    setLines(next);
    emit(warehouseId, next);
  };

  const addLine = () => {
    const next = [...lines, emptyLine()];
    setLines(next);
    emit(warehouseId, next);
  };

  const removeLine = (key: number) => {
    const next = lines.filter((l) => l.key !== key);
    setLines(next);
    emit(warehouseId, next);
  };

  const handleScan = async (code: string) => {
    setScanning(false);
    try {
      const item = await getItemByCode(code.trim());
      const label = itemLabel(item);
      const empty = lines.find((l) => !l.itemId);
      const next = empty
        ? lines.map((l) =>
            l.key === empty.key
              ? { ...l, itemId: item._id, itemText: label }
              : l
          )
        : [...lines, { ...emptyLine(), itemId: item._id, itemText: label }];
      setLines(next);
      emit(warehouseId, next);
      toast.success(tOp('scanned', { name: item.name }));
    } catch {
      toast.error(tOp('scanNotFound', { code }));
    }
  };

  return (
    <div className={css.wrap}>
      <SelectDropdown
        options={warehouses.map((w) => w.name)}
        selectedValue={warehouseText}
        placeholder={t('selectWarehouse')}
        onSelect={selectWarehouse}
      />

      <div className={css.lines}>
        {lines.map((l) => (
          <div key={l.key} className={css.lineRow}>
            <div className={css.lineItem}>
              <SelectDropdown
                options={items.map(itemLabel)}
                selectedValue={l.itemText}
                placeholder={tOp('itemPlaceholder')}
                onSelect={(label) => {
                  const i = itemByLabel.get(label);
                  if (i) patchLine(l.key, { itemId: i._id, itemText: label });
                }}
              />
            </div>
            <input
              className={css.qty}
              type="number"
              min={0}
              placeholder={tOp('qty')}
              value={l.quantity}
              onChange={(e) => patchLine(l.key, { quantity: e.target.value })}
            />
            {lines.length > 1 && (
              <button
                type="button"
                className={css.remove}
                onClick={() => removeLine(l.key)}
                aria-label={tOp('qty')}
              >
                <svg>
                  <use href="/sprite.svg#close" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={css.btnRow}>
        <button type="button" className={css.addBtn} onClick={addLine}>
          + {tOp('addLine')}
        </button>
        <button
          type="button"
          className={css.addBtn}
          onClick={() => setScanning(true)}
        >
          {tOp('scan')}
        </button>
      </div>

      {scanning && (
        <QrScannerModal
          onScan={handleScan}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
};

export default FaultMaterialsPicker;
