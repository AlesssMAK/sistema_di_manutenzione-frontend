'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  getAllItems,
  getAllWarehouses,
  getItemByCode,
  stockAdjust,
  stockIn,
  stockOut,
  stockTransfer,
} from '@/lib/api/warehouse';
import QrScannerModal from '@/components/Warehouse/QrScannerModal/QrScannerModal';
import type {
  InventoryItem,
  MovementLine,
  ReferenceType,
  StockOutWarning,
  Warehouse,
} from '@/types/warehouseType';
import Button from '@/components/UI/Button/Button';
import Modal from '@/components/UI/Modal/Modal';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import css from './Stock.module.css';

export type StockOp = 'in' | 'out' | 'adjust' | 'transfer';

interface StockOpModalProps {
  op: StockOp;
  warehouseId: string;
  onClose: () => void;
  onDone: () => void;
}

const itemLabel = (i: { name: string; code: string }) =>
  `${i.name} (${i.code})`;

interface DraftLine {
  key: number;
  itemId: string;
  itemText: string;
  quantity: string;
}

let lineSeq = 0;
const emptyLine = (): DraftLine => ({
  key: ++lineSeq,
  itemId: '',
  itemText: '',
  quantity: '',
});

const StockOpModal = ({
  op,
  warehouseId,
  onClose,
  onDone,
}: StockOpModalProps) => {
  const t = useTranslations('WarehousePage.stock.op');
  const tCommon = useTranslations('WarehousePage.catalog.common');
  const queryClient = useQueryClient();

  const isAdjust = op === 'adjust';
  const isTransfer = op === 'transfer';
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [note, setNote] = useState('');
  const [refType, setRefType] = useState<ReferenceType>('none');
  const [refLabel, setRefLabel] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [toWarehouseText, setToWarehouseText] = useState('');
  const [warnings, setWarnings] = useState<StockOutWarning[]>([]);
  const [scanning, setScanning] = useState(false);

  const { data: itemsData } = useQuery({
    queryKey: ['warehouse', 'items', 'active-pool'],
    queryFn: () => getAllItems({ status: 'active', perPage: 200 }),
  });
  const { data: whData } = useQuery({
    queryKey: ['warehouse', 'warehouses', 'active-pool'],
    queryFn: () => getAllWarehouses({ status: 'active', perPage: 200 }),
    enabled: isTransfer,
  });
  // Destination options exclude the source warehouse.
  const destWarehouses: Warehouse[] = useMemo(
    () => (whData?.warehouses ?? []).filter(w => w._id !== warehouseId),
    [whData, warehouseId]
  );
  const whByLabel = useMemo(() => {
    const map = new Map<string, Warehouse>();
    destWarehouses.forEach(w => map.set(w.name, w));
    return map;
  }, [destWarehouses]);
  const items: InventoryItem[] = useMemo(
    () => itemsData?.items ?? [],
    [itemsData]
  );
  const itemByLabel = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    items.forEach(i => map.set(itemLabel(i), i));
    return map;
  }, [items]);

  const refOptions: { value: ReferenceType; label: string }[] = [
    { value: 'none', label: t('ref.none') },
    { value: 'task', label: t('ref.task') },
  ];
  const refLabelByValue = new Map(refOptions.map(o => [o.value, o.label]));

  const invalidateStock = () => {
    queryClient.invalidateQueries({ queryKey: ['warehouse', 'stock'] });
    queryClient.invalidateQueries({ queryKey: ['warehouse', 'movements'] });
  };

  const setLine = (key: number, patch: Partial<DraftLine>) =>
    setLines(prev => prev.map(l => (l.key === key ? { ...l, ...patch } : l)));

  // Resolve a scanned SKU to an item and drop it into a line: the single
  // line for adjust, the first empty line (or a new one) for in/out.
  const handleScan = async (code: string) => {
    setScanning(false);
    try {
      const item = await getItemByCode(code.trim());
      const label = itemLabel(item);
      if (isAdjust) {
        setLine(lines[0].key, { itemId: item._id, itemText: label });
      } else {
        const empty = lines.find(l => !l.itemId);
        if (empty) {
          setLine(empty.key, { itemId: item._id, itemText: label });
        } else {
          setLines(prev => [
            ...prev,
            { ...emptyLine(), itemId: item._id, itemText: label },
          ]);
        }
      }
      toast.success(t('scanned', { name: item.name }));
    } catch {
      toast.error(t('scanNotFound', { code }));
    }
  };

  const toLines = (): MovementLine[] =>
    lines
      .filter(l => l.itemId && Number(l.quantity) > 0)
      .map(l => ({ itemId: l.itemId, quantity: Number(l.quantity) }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (isAdjust) {
        const l = lines[0];
        return stockAdjust({
          warehouseId,
          itemId: l.itemId,
          quantity: Number(l.quantity),
          note: note.trim() || undefined,
        });
      }
      const payloadLines = toLines();
      if (op === 'in') {
        return stockIn({
          warehouseId,
          lines: payloadLines,
          note: note.trim() || undefined,
        });
      }
      if (op === 'transfer') {
        return stockTransfer({
          fromWarehouseId: warehouseId,
          toWarehouseId,
          lines: payloadLines,
          note: note.trim() || undefined,
        });
      }
      return stockOut({
        warehouseId,
        lines: payloadLines,
        reference:
          refType === 'none'
            ? { type: 'none' }
            : { type: 'task', label: refLabel.trim() || undefined },
        note: note.trim() || undefined,
      });
    },
    onSuccess: res => {
      invalidateStock();
      if (
        (op === 'out' || op === 'transfer') &&
        res.warnings &&
        res.warnings.length > 0
      ) {
        // Surface the low/negative warnings but keep the success — the
        // issue went through (negative stock is allowed).
        setWarnings(res.warnings);
        toast.success(t('doneWithWarnings'));
        return;
      }
      toast.success(t('done'));
      onDone();
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : tCommon('error');
      toast.error(message);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTransfer && !toWarehouseId) {
      toast.error(t('selectDestination'));
      return;
    }
    if (isAdjust) {
      const l = lines[0];
      if (!l.itemId || l.quantity === '' || Number(l.quantity) < 0) {
        toast.error(tCommon('fillRequired'));
        return;
      }
    } else if (toLines().length === 0) {
      toast.error(t('addAtLeastOne'));
      return;
    }
    mutation.mutate();
  };

  const title = isTransfer
    ? t('titleTransfer')
    : op === 'in'
      ? t('titleIn')
      : op === 'out'
        ? t('titleOut')
        : t('titleAdjust');

  return (
    <>
      <Modal onClose={onClose}>
        <form className={css.form} onSubmit={onSubmit}>
        <h2 className={`${css.formTitle} title`}>{title}</h2>

        {warnings.length === 0 && (
          <Button
            type="button"
            className={`${css.scanBtn} button button--white`}
            onClick={() => setScanning(true)}
          >
            {t('scan')}
          </Button>
        )}

        {warnings.length > 0 ? (
          <div className={css.warnBox}>
            <p>{t('warningsIntro')}</p>
            <ul>
              {warnings.map(w => (
                <li key={w.itemId}>
                  {w.name ?? w.itemId}: {w.quantity}
                  {w.negative ? ` — ${t('negative')}` : ` (≤ ${w.minLevel})`}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            {isTransfer && (
              <div className={css.field}>
                <label className={css.label}>{t('destination')} *</label>
                <SelectDropdown
                  options={destWarehouses.map(w => w.name)}
                  selectedValue={toWarehouseText}
                  placeholder={t('selectDestination')}
                  onSelect={label => {
                    const w = whByLabel.get(label);
                    if (w) {
                      setToWarehouseId(w._id);
                      setToWarehouseText(label);
                    }
                  }}
                />
              </div>
            )}
            {isAdjust ? (
              <>
                <div className={css.field}>
                  <label className={css.label}>{t('item')} *</label>
                  <SelectDropdown
                    options={items.map(itemLabel)}
                    selectedValue={lines[0].itemText}
                    placeholder={t('itemPlaceholder')}
                    onSelect={label => {
                      const i = itemByLabel.get(label);
                      if (i)
                        setLine(lines[0].key, {
                          itemId: i._id,
                          itemText: label,
                        });
                    }}
                  />
                </div>
                <div className={css.field}>
                  <label className={css.label}>{t('countedQty')} *</label>
                  <input
                    className={css.input}
                    type="number"
                    min={0}
                    value={lines[0].quantity}
                    onChange={e =>
                      setLine(lines[0].key, { quantity: e.target.value })
                    }
                  />
                </div>
              </>
            ) : (
              <div className={css.field}>
                <label className={css.label}>{t('lines')} *</label>
                <div className={css.lines}>
                  {lines.map(l => (
                    <div key={l.key} className={css.lineRow}>
                      <div className={css.lineItem}>
                        <SelectDropdown
                          options={items.map(itemLabel)}
                          selectedValue={l.itemText}
                          placeholder={t('itemPlaceholder')}
                          onSelect={label => {
                            const i = itemByLabel.get(label);
                            if (i)
                              setLine(l.key, {
                                itemId: i._id,
                                itemText: label,
                              });
                          }}
                        />
                      </div>
                      <input
                        className={`${css.input} ${css.lineQty}`}
                        type="number"
                        min={0}
                        placeholder={t('qty')}
                        value={l.quantity}
                        onChange={e =>
                          setLine(l.key, { quantity: e.target.value })
                        }
                      />
                      {lines.length > 1 && (
                        <button
                          type="button"
                          className={css.lineRemove}
                          onClick={() =>
                            setLines(prev => prev.filter(x => x.key !== l.key))
                          }
                          aria-label={tCommon('deactivate')}
                        >
                          <svg>
                            <use href="/sprite.svg#close" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className={css.addLineBtn}
                  onClick={() => setLines(prev => [...prev, emptyLine()])}
                >
                  + {t('addLine')}
                </button>
              </div>
            )}

            {op === 'out' && (
              <>
                <div className={css.field}>
                  <label className={css.label}>{t('ref.label')}</label>
                  <SelectDropdown
                    options={refOptions.map(o => o.label)}
                    selectedValue={refLabelByValue.get(refType) ?? ''}
                    onSelect={label => {
                      const found = refOptions.find(o => o.label === label);
                      if (found) setRefType(found.value);
                    }}
                  />
                </div>
                {refType === 'task' && (
                  <div className={css.field}>
                    <label className={css.label}>{t('ref.taskLabel')}</label>
                    <input
                      className={css.input}
                      value={refLabel}
                      onChange={e => setRefLabel(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            <div className={css.field}>
              <label className={css.label}>{t('note')}</label>
              <textarea
                className={css.textarea}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </>
        )}

        <div className={css.formActions}>
          {warnings.length > 0 ? (
            <Button
              type="button"
              className="button button--blue"
              width="100%"
              onClick={() => {
                onDone();
                onClose();
              }}
            >
              {tCommon('close')}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                className="button button--white"
                width="100%"
                onClick={onClose}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="submit"
                className="button button--blue"
                width="100%"
                disabled={mutation.isPending}
              >
                {t('confirm')}
              </Button>
            </>
          )}
        </div>
        </form>
      </Modal>

      {scanning && (
        <QrScannerModal
          onScan={handleScan}
          onClose={() => setScanning(false)}
        />
      )}
    </>
  );
};

export default StockOpModal;
