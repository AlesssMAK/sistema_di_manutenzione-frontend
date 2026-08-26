'use client';

import { useMemo, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';
import {
  getAllCategories,
  getMovements,
  getStock,
  stockSetMin,
} from '@/lib/api/warehouse';
import type {
  Category,
  ItemRef,
  StockLevel,
  StockMovement,
} from '@/types/warehouseType';
import Button from '@/components/UI/Button/Button';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import { useWarehouseContext } from '@/lib/hooks/useWarehouseContext';
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
const itemIdOf = (item: StockLevel['itemId']): string =>
  typeof item === 'string' ? item : (item as ItemRef)._id;

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
  const tItems = useTranslations('WarehousePage.catalog.items');
  const tNoFound = useTranslations('NoFound');

  const [warehouseId, setWarehouseId] = useState('');
  const [warehouseText, setWarehouseText] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [lowOnly, setLowOnly] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [op, setOp] = useState<StockOp | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Keeper (management) context: all active warehouses narrowed by the
  // user's access. When it resolves to one, the picker is hidden and it
  // is selected implicitly.
  const {
    candidates: visibleWarehouses,
    single,
    showPicker,
  } = useWarehouseContext('management');
  const whByLabel = useMemo(() => {
    const map = new Map<string, (typeof visibleWarehouses)[number]>();
    visibleWarehouses.forEach((w) => map.set(w.name, w));
    return map;
  }, [visibleWarehouses]);

  // The warehouse the table operates on: the explicit pick when the
  // picker is shown, otherwise the sole warehouse (single-warehouse
  // case). Derived at render so no effect is needed to auto-select it.
  const activeWarehouseId = warehouseId || single?._id || '';

  const { data: catData } = useQuery({
    queryKey: ['warehouse', 'categories', 'active-pool'],
    queryFn: () => getAllCategories({ status: 'active', perPage: 200 }),
  });
  const categories: Category[] = useMemo(
    () => catData?.categories ?? [],
    [catData]
  );
  const allCategoriesLabel = tItems('fields.allCategories');
  const catNameById = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c._id, c.name));
    return m;
  }, [categories]);
  const catIdByName = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.name, c._id));
    return m;
  }, [categories]);

  const { data: stockData, isLoading, isError } = useQuery({
    queryKey: [
      'warehouse',
      'stock',
      activeWarehouseId,
      debouncedSearch || undefined,
      categoryId,
      lowOnly,
      page,
    ],
    queryFn: () =>
      getStock({
        warehouseId: activeWarehouseId,
        search: debouncedSearch,
        ...(categoryId ? { categoryId } : {}),
        lowOnly,
        page,
        perPage: PER_PAGE,
      }),
    enabled: Boolean(activeWarehouseId),
    placeholderData: keepPreviousData,
  });

  const { data: movData } = useQuery({
    queryKey: ['warehouse', 'movements', activeWarehouseId],
    queryFn: () => getMovements({ warehouseId: activeWarehouseId, perPage: 20 }),
    enabled: Boolean(activeWarehouseId) && showHistory,
  });

  const levels = stockData?.levels ?? [];
  const totalPages = stockData?.pagination.totalPages ?? 0;
  const movements: StockMovement[] = movData?.movements ?? [];

  // Inline reorder-point editor: click the MIN cell to edit, commit on
  // blur/Enter. The server writes to this (item x warehouse) stock line.
  const queryClient = useQueryClient();
  const [editMinId, setEditMinId] = useState<string | null>(null);
  const [editMinValue, setEditMinValue] = useState('');
  const setMin = useMutation({
    mutationFn: (vars: { itemId: string; minLevel: number }) =>
      stockSetMin({
        itemId: vars.itemId,
        warehouseId: activeWarehouseId,
        minLevel: vars.minLevel,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse', 'stock'] });
      setEditMinId(null);
    },
    onError: () => toast.error(t('minError')),
  });
  const commitMin = (itemId: string) => {
    const n = Number(editMinValue);
    if (!Number.isFinite(n) || n < 0) {
      setEditMinId(null);
      return;
    }
    setMin.mutate({ itemId, minLevel: n });
  };

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
      id: 'category',
      type: 'select',
      label: tItems('fields.category'),
      value: categoryId
        ? (catNameById.get(categoryId) ?? allCategoriesLabel)
        : allCategoriesLabel,
      options: [allCategoriesLabel, ...categories.map((c) => c.name)],
      onSelect: (label) => {
        setCategoryId(
          label === allCategoriesLabel ? '' : (catIdByName.get(label) ?? '')
        );
        setPage(1);
      },
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
    setCategoryId('');
    setPage(1);
  };

  const movTypeClass = (type: string) =>
    type === 'in' ? css.movIn : type === 'out' ? css.movOut : css.movAdjust;

  return (
    <div>
      <div className={css.toolbar}>
        {showPicker && (
          <div className={css.filter}>
            <label className={css.filterLabel}>{t('warehouseLabel')}</label>
            <SelectDropdown
              options={visibleWarehouses.map((w) => w.name)}
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
        )}
        <div className={css.spacer} />
        <div className={css.actions}>
          <Button
            type="button"
            className={`${css.actionBtn} button button--blue`}
            disabled={!activeWarehouseId}
            onClick={() => setOp('in')}
          >
            {t('actions.in')}
          </Button>
          <Button
            type="button"
            className={`${css.actionBtn} button button--white`}
            disabled={!activeWarehouseId}
            onClick={() => setOp('out')}
          >
            {t('actions.out')}
          </Button>
          <Button
            type="button"
            className={`${css.actionBtn} button button--white`}
            disabled={!activeWarehouseId}
            onClick={() => setOp('adjust')}
          >
            {t('actions.adjust')}
          </Button>
          {showPicker && (
            <Button
              type="button"
              className={`${css.actionBtn} button button--white`}
              disabled={!activeWarehouseId}
              onClick={() => setOp('transfer')}
            >
              {t('actions.transfer')}
            </Button>
          )}
        </div>
      </div>

      {activeWarehouseId && (
        <div className={css.filtersGap}>
          <Filters items={filters} onClear={onClearFilters} />
        </div>
      )}

      {!activeWarehouseId ? (
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
                    <td className={css.minCell}>
                      {editMinId === lvl._id ? (
                        <input
                          className={css.minInput}
                          type="number"
                          min={0}
                          autoFocus
                          value={editMinValue}
                          onChange={(e) => setEditMinValue(e.target.value)}
                          onBlur={() => commitMin(itemIdOf(lvl.itemId))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter')
                              commitMin(itemIdOf(lvl.itemId));
                            if (e.key === 'Escape') setEditMinId(null);
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          className={css.minValue}
                          onClick={() => {
                            setEditMinId(lvl._id);
                            setEditMinValue(String(lvl.minLevel));
                          }}
                          title={t('setMinTitle')}
                        >
                          {lvl.minLevel}
                        </button>
                      )}
                    </td>
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

      {activeWarehouseId && (
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
          warehouseId={activeWarehouseId}
          onClose={() => setOp(null)}
          onDone={() => setOp(null)}
        />
      )}
    </div>
  );
};

export default WarehouseStock;
