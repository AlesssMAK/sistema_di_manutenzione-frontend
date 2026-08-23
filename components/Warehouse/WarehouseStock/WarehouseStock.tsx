'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useDebounce } from 'use-debounce';
import { getAllWarehouses, getMovements, getStock } from '@/lib/api/warehouse';
import type {
  ItemRef,
  StockLevel,
  StockMovement,
  Warehouse,
} from '@/types/warehouseType';
import Button from '@/components/UI/Button/Button';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import StockOpModal, { type StockOp } from './StockOpModal';
import css from './Stock.module.css';

const PER_PAGE = 20;

const unitCode = (item: StockLevel['itemId']): string => {
  if (typeof item === 'string') return '';
  const ref = item as ItemRef;
  return typeof ref.unitId === 'string' ? '' : ref.unitId.code;
};
const itemName = (item: StockLevel['itemId']): string =>
  typeof item === 'string' ? item : (item as ItemRef).name;

// For package-tracked items, how many whole-ish packages the on-hand
// represents (informational only). Rounded to one decimal.
const packageInfo = (
  item: StockLevel['itemId'],
  quantity: number
): { label: string; approx: number } | null => {
  if (typeof item === 'string') return null;
  const ref = item as ItemRef;
  if (!ref.packageLabel || !ref.unitsPerPackage || ref.unitsPerPackage <= 0) {
    return null;
  }
  return {
    label: ref.packageLabel,
    approx: Math.round((quantity / ref.unitsPerPackage) * 10) / 10,
  };
};

const WarehouseStock = () => {
  const t = useTranslations('WarehousePage.stock');
  const tNoFound = useTranslations('NoFound');

  const [warehouseId, setWarehouseId] = useState('');
  const [warehouseText, setWarehouseText] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [op, setOp] = useState<StockOp | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: whData } = useQuery({
    queryKey: ['warehouse', 'warehouses', 'active-pool'],
    queryFn: () => getAllWarehouses({ status: 'active', perPage: 200 }),
  });
  const warehouses: Warehouse[] = useMemo(
    () => whData?.warehouses ?? [],
    [whData]
  );
  const whByLabel = useMemo(() => {
    const map = new Map<string, Warehouse>();
    warehouses.forEach((w) => map.set(w.name, w));
    return map;
  }, [warehouses]);

  const { data: stockData, isLoading, isError } = useQuery({
    queryKey: ['warehouse', 'stock', warehouseId, debouncedSearch || undefined, lowOnly, page],
    queryFn: () =>
      getStock({ warehouseId, search: debouncedSearch, lowOnly, page, perPage: PER_PAGE }),
    enabled: Boolean(warehouseId),
    placeholderData: keepPreviousData,
  });

  const { data: movData } = useQuery({
    queryKey: ['warehouse', 'movements', warehouseId],
    queryFn: () => getMovements({ warehouseId, perPage: 20 }),
    enabled: Boolean(warehouseId) && showHistory,
  });

  const levels = stockData?.levels ?? [];
  const totalPages = stockData?.pagination.totalPages ?? 0;
  const movements: StockMovement[] = movData?.movements ?? [];

  const filters: FiltersItem[] = [
    {
      id: 'search',
      type: 'input',
      label: t('searchLabel'),
      value: search,
      placeholder: t('searchPlaceholder'),
      onChange: (v) => {
        setSearch(v);
        setPage(1);
      },
      icon: 'search',
    },
    {
      id: 'level',
      type: 'select',
      label: t('levelLabel'),
      value: lowOnly ? t('lowOnly') : t('all'),
      options: [t('all'), t('lowOnly')],
      onSelect: (label) => {
        setLowOnly(label === t('lowOnly'));
        setPage(1);
      },
    },
  ];
  const onClearFilters = () => {
    setSearch('');
    setLowOnly(false);
    setPage(1);
  };

  const movTypeClass = (type: string) =>
    type === 'in' ? css.movIn : type === 'out' ? css.movOut : css.movAdjust;

  return (
    <div>
      <div className={css.toolbar}>
        <div className={css.filter}>
          <label className={css.filterLabel}>{t('warehouseLabel')}</label>
          <SelectDropdown
            options={warehouses.map((w) => w.name)}
            selectedValue={warehouseText}
            placeholder={t('selectWarehouse')}
            onSelect={(label) => {
              const w = whByLabel.get(label);
              if (w) {
                setWarehouseId(w._id);
                setWarehouseText(label);
                setPage(1);
              }
            }}
          />
        </div>
        <div className={css.spacer} />
        <div className={css.actions}>
          <Button
            type="button"
            className={`${css.actionBtn} button button--blue`}
            disabled={!warehouseId}
            onClick={() => setOp('in')}
          >
            {t('actions.in')}
          </Button>
          <Button
            type="button"
            className={`${css.actionBtn} button button--white`}
            disabled={!warehouseId}
            onClick={() => setOp('out')}
          >
            {t('actions.out')}
          </Button>
          <Button
            type="button"
            className={`${css.actionBtn} button button--white`}
            disabled={!warehouseId}
            onClick={() => setOp('adjust')}
          >
            {t('actions.adjust')}
          </Button>
          <Button
            type="button"
            className={`${css.actionBtn} button button--white`}
            disabled={!warehouseId}
            onClick={() => setOp('transfer')}
          >
            {t('actions.transfer')}
          </Button>
        </div>
      </div>

      {warehouseId && (
        <div className={css.filtersGap}>
          <Filters items={filters} onClear={onClearFilters} />
        </div>
      )}

      {!warehouseId ? (
        <NoFound title={t('pickWarehouseTitle')} message={t('pickWarehouseHint')} hideIcon />
      ) : isLoading ? (
        <div className={css.loaderWrap}>
          <Loader />
        </div>
      ) : isError ? (
        <NoFound title={tNoFound('serverErrorTitle')} message={tNoFound('serverErrorMessage')} hideIcon />
      ) : levels.length === 0 ? (
        <NoFound title={tNoFound('emptyTitle')} message={t('empty')} hideIcon />
      ) : (
        <div className={css.tableWrap}>
          <table className={css.table}>
            <thead>
              <tr>
                <th>{t('table.item')}</th>
                <th>{t('table.unit')}</th>
                <th>{t('table.quantity')}</th>
                <th>{t('table.min')}</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((lvl) => {
                const low = lvl.quantity <= lvl.minLevel;
                const pkg = packageInfo(lvl.itemId, lvl.quantity);
                return (
                  <tr key={lvl._id}>
                    <td>{itemName(lvl.itemId)}</td>
                    <td>{unitCode(lvl.itemId)}</td>
                    <td>
                      <span className={`${css.qty} ${low ? css.qtyLow : ''}`}>
                        {lvl.quantity}
                      </span>
                      {low && <span className={css.lowBadge}>{t('low')}</span>}
                      {pkg && (
                        <span className={css.pkgHint}>
                          ≈ {pkg.approx} {pkg.label}
                        </span>
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

      {totalPages > 1 && (
        <div style={{ marginTop: '20px' }}>
          <Pagination totalPages={totalPages} page={page} onPageChange={setPage} />
        </div>
      )}

      {warehouseId && (
        <>
          <div className={css.historyHeader}>
            <span className={css.historyTitle}>{t('history.title')}</span>
            <Button
              type="button"
              className="button button--white"
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory ? t('history.hide') : t('history.show')}
            </Button>
          </div>
          {showHistory &&
            (movements.length === 0 ? (
              <NoFound title={tNoFound('emptyTitle')} message={t('history.empty')} hideIcon />
            ) : (
              <div className={css.tableWrap}>
                <table className={css.table}>
                  <thead>
                    <tr>
                      <th>{t('history.type')}</th>
                      <th>{t('history.item')}</th>
                      <th>{t('history.qty')}</th>
                      <th>{t('history.by')}</th>
                      <th>{t('history.when')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m._id}>
                        <td>
                          <span className={`${css.movType} ${movTypeClass(m.type)}`}>
                            {t(`type.${m.type}`)}
                          </span>
                        </td>
                        <td>{itemName(m.itemId)}</td>
                        <td>{m.quantity}</td>
                        <td>{m.userName}</td>
                        <td>{new Date(m.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </>
      )}

      {op && (
        <StockOpModal
          op={op}
          warehouseId={warehouseId}
          onClose={() => setOp(null)}
          onDone={() => setOp(null)}
        />
      )}
    </div>
  );
};

export default WarehouseStock;
