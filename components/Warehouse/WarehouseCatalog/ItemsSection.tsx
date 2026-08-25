'use client';

import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useDebounce } from 'use-debounce';
import toast from 'react-hot-toast';
import {
  createItem,
  deleteItem,
  getAllCategories,
  getAllItems,
  getAllUnits,
  updateItem,
} from '@/lib/api/warehouse';
import type { Category, InventoryItem, Unit } from '@/types/warehouseType';
import Button from '@/components/UI/Button/Button';
import Modal from '@/components/UI/Modal/Modal';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import Toggle from '@/components/UI/Toggle/Toggle';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import LabelModal from '@/components/Warehouse/LabelModal/LabelModal';
import QrScannerModal from '@/components/Warehouse/QrScannerModal/QrScannerModal';
import ItemDetailModal from './ItemDetailModal';
import { fetchSystemSettings } from '@/lib/api/systemSettings';
import { useStatusOptions } from '@/constants/status';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import css from './Catalog.module.css';

const PER_PAGE = 10;

const unitLabel = (u: { name: string; code: string }) =>
  `${u.name} (${u.code})`;

// unitId is populated on read, a plain id on write.
const unitIdOf = (item: InventoryItem): string =>
  typeof item.unitId === 'string' ? item.unitId : item.unitId._id;
const unitTextOf = (item: InventoryItem): string =>
  typeof item.unitId === 'string' ? '' : unitLabel(item.unitId);

// categoryId is populated ({ _id, name }) on read, a plain id on write.
const categoryIdOf = (item: InventoryItem): string =>
  !item.categoryId
    ? ''
    : typeof item.categoryId === 'string'
      ? item.categoryId
      : item.categoryId._id;
const categoryNameOf = (item: InventoryItem): string =>
  !item.categoryId || typeof item.categoryId === 'string'
    ? ''
    : item.categoryId.name;

interface ItemsSectionProps {
  /** Hide the internal "new" button — the parent renders it in the page
   *  header (catalog view) instead, calling openNew() via the ref. */
  hideNewButton?: boolean;
}

export interface ItemsSectionHandle {
  openNew: () => void;
}

const ItemsSection = forwardRef<ItemsSectionHandle, ItemsSectionProps>(
  ({ hideNewButton = false }, ref) => {
    const t = useTranslations('WarehousePage.catalog.items');
  const tCommon = useTranslations('WarehousePage.catalog.common');
  const tQr = useTranslations('WarehousePage.qr');
  const tNoFound = useTranslations('NoFound');
  const tStatuses = useTranslations('Statuses');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [labelItem, setLabelItem] = useState<InventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);

  const [categoryId, setCategoryId] = useState('');

  const statusMapper = createOptionMapper(useStatusOptions());

  // Active categories drive both the catalog filter and the item form
  // select.
  const { data: catData } = useQuery({
    queryKey: ['warehouse', 'categories', 'active-pool'],
    queryFn: () => getAllCategories({ status: 'active', perPage: 200 }),
  });
  const categories: Category[] = useMemo(
    () => catData?.categories ?? [],
    [catData]
  );
  const allCategoriesLabel = t('fields.allCategories');
  const catNameById = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c._id, c.name));
    return m;
  }, [categories]);
  const catIdByName = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c.name, c._id));
    return m;
  }, [categories]);

  const filters: FiltersItem[] = [
    {
      id: 'search',
      type: 'input',
      label: tCommon('searchLabel'),
      value: search,
      placeholder: tCommon('searchPlaceholder'),
      onChange: setSearch,
      icon: 'search',
    },
    {
      id: 'category',
      type: 'select',
      label: t('fields.category'),
      value: categoryId
        ? (catNameById.get(categoryId) ?? allCategoriesLabel)
        : allCategoriesLabel,
      options: [allCategoriesLabel, ...categories.map(c => c.name)],
      onSelect: label =>
        setCategoryId(
          label === allCategoriesLabel ? '' : (catIdByName.get(label) ?? '')
        ),
    },
    {
      id: 'status',
      type: 'select',
      label: tCommon('statusLabel'),
      value: statusMapper.getLabelByValue(status) ?? tStatuses('all'),
      options: statusMapper.labelsArray,
      onSelect: label => setStatus(statusMapper.getValueByLabel(label) ?? ''),
    },
  ];
  const onClear = () => {
    setSearch('');
    setStatus('');
    setCategoryId('');
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'warehouse',
      'items',
      debouncedSearch || undefined,
      status,
      categoryId,
      page,
    ],
    queryFn: () =>
      getAllItems({
        search: debouncedSearch,
        status,
        ...(categoryId ? { categoryId } : {}),
        page,
        perPage: PER_PAGE,
      }),
    placeholderData: keepPreviousData,
  });

  const { data: settings } = useQuery({
    queryKey: ['systemSettings', 'public'],
    queryFn: fetchSystemSettings,
    staleTime: 5 * 60 * 1000,
  });
  const labelFormats = settings?.warehouse?.labels ?? {
    qr: true,
    barcode: true,
  };
  const labelsEnabled = labelFormats.qr || labelFormats.barcode;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['warehouse', 'items'] });

  const close = () => setIsOpen(false);

  // Let the parent's header button open the create form imperatively —
  // no setState-in-effect, the form modal stays owned here.
  useImperativeHandle(ref, () => ({
    openNew: () => {
      setEditing(null);
      setIsOpen(true);
    },
  }));

  const items = data?.items ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;

  return (
    <div className={css.section}>
      {!hideNewButton && (
        <div className={css.head}>
          <Button
            type="button"
            className={`${css.newBtn} button button--blue`}
            onClick={() => {
              setEditing(null);
              setIsOpen(true);
            }}
          >
            <svg width="16" height="16" className={css.plus_btn}>
              <use href="/sprite.svg#plus" />
            </svg>
            {t('new')}
          </Button>
        </div>
      )}
      <div className={css.filtersGap}>
        <Filters items={filters} onClear={onClear} />
      </div>

      {isLoading ? (
        <div className={css.loaderWrap}>
          <Loader />
        </div>
      ) : isError ? (
        <NoFound
          title={tNoFound('serverErrorTitle')}
          message={tNoFound('serverErrorMessage')}
          hideIcon
        />
      ) : items.length === 0 ? (
        <NoFound title={tNoFound('emptyTitle')} message={t('empty')} hideIcon />
      ) : (
        <ul className={css.list}>
          {items.map(item => (
            <li
              key={item._id}
              className={`${css.row} ${css.rowClickable} ${item.status === 'deactivated' ? css.rowDeactivated : ''}`}
              onClick={() => setDetailItem(item)}
            >
              <div className={css.rowMain}>
                <span className={css.rowName}>
                  {item.name}
                  <span className={css.rowCode}>({item.code})</span>
                </span>
                <div className={css.rowSub}>
                  {typeof item.unitId !== 'string' && unitLabel(item.unitId)}
                  {categoryNameOf(item) ? ` · ${categoryNameOf(item)}` : ''}
                </div>
              </div>
              {item.status === 'deactivated' && (
                <span className={css.badge}>{tCommon('deactivated')}</span>
              )}
              <div className={css.rowActions}>
                {labelsEnabled && (
                  <button
                    type="button"
                    className={css.iconBtn}
                    onClick={e => {
                      e.stopPropagation();
                      setLabelItem(item);
                    }}
                    aria-label={tQr('labelBtn')}
                    title={tQr('labelBtn')}
                  >
                    <svg>
                      <use href="/sprite.svg#squares" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  className={css.iconBtn}
                  onClick={e => {
                    e.stopPropagation();
                    setEditing(item);
                    setIsOpen(true);
                  }}
                  aria-label={tCommon('edit')}
                  title={tCommon('edit')}
                >
                  <svg>
                    <use href="/sprite.svg#edit" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className={css.paginationWrap}>
          <Pagination
            totalPages={totalPages}
            page={page}
            onPageChange={setPage}
          />
        </div>
      )}

      {isOpen && (
        <ItemFormModal item={editing} onClose={close} onSaved={invalidate} />
      )}

      {labelItem && (
        <LabelModal
          code={labelItem.code}
          name={labelItem.name}
          formats={labelFormats}
          onClose={() => setLabelItem(null)}
        />
      )}

      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          labelsEnabled={labelsEnabled}
          onClose={() => setDetailItem(null)}
          onEdit={() => {
            setEditing(detailItem);
            setIsOpen(true);
            setDetailItem(null);
          }}
          onLabel={() => {
            setLabelItem(detailItem);
            setDetailItem(null);
          }}
        />
      )}
    </div>
  );
  }
);

ItemsSection.displayName = 'ItemsSection';

interface ItemFormModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: () => void;
}

const ItemFormModal = ({ item, onClose, onSaved }: ItemFormModalProps) => {
  const t = useTranslations('WarehousePage.catalog.items');
  const tCommon = useTranslations('WarehousePage.catalog.common');
  const tQr = useTranslations('WarehousePage.qr');
  const isEdit = Boolean(item);

  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [categoryId, setCategoryId] = useState(item ? categoryIdOf(item) : '');
  const [categoryText, setCategoryText] = useState(
    item ? categoryNameOf(item) : ''
  );
  const [note, setNote] = useState(item?.note ?? '');
  const [unitId, setUnitId] = useState(item ? unitIdOf(item) : '');
  const [unitText, setUnitText] = useState(item ? unitTextOf(item) : '');
  const [packageLabel, setPackageLabel] = useState(item?.packageLabel ?? '');
  const [unitsPerPackage, setUnitsPerPackage] = useState(
    item?.unitsPerPackage != null ? String(item.unitsPerPackage) : ''
  );
  const [active, setActive] = useState(item ? item.status === 'active' : true);

  // Active units only — the pool for the picker.
  const { data: unitsData } = useQuery({
    queryKey: ['warehouse', 'units', 'active-pool'],
    queryFn: () => getAllUnits({ status: 'active', perPage: 200 }),
  });
  const units: Unit[] = useMemo(() => unitsData?.units ?? [], [unitsData]);
  const unitByLabel = useMemo(() => {
    const map = new Map<string, Unit>();
    units.forEach(u => map.set(unitLabel(u), u));
    return map;
  }, [units]);

  // Active categories for the select (deduped with the catalog filter).
  const { data: catData } = useQuery({
    queryKey: ['warehouse', 'categories', 'active-pool'],
    queryFn: () => getAllCategories({ status: 'active', perPage: 200 }),
  });
  const categories: Category[] = useMemo(
    () => catData?.categories ?? [],
    [catData]
  );
  const categoryByName = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.name, c));
    return map;
  }, [categories]);

  const mutation = useMutation({
    mutationFn: async () => {
      const perPackage = unitsPerPackage.trim()
        ? Number(unitsPerPackage)
        : undefined;
      if (isEdit && item) {
        return updateItem({
          itemId: item._id,
          data: {
            code: code.trim(),
            name: name.trim(),
            // null clears the category on the item.
            categoryId: categoryId || null,
            unitId,
            // null clears a previously set package on the item.
            packageLabel: packageLabel.trim() || null,
            unitsPerPackage: perPackage ?? null,
            note: note.trim(),
            status: active ? 'active' : 'deactivated',
          },
        });
      }
      return createItem({
        code: code.trim(),
        name: name.trim(),
        categoryId: categoryId || undefined,
        unitId,
        packageLabel: packageLabel.trim() || undefined,
        unitsPerPackage: perPackage,
        note: note.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? tCommon('saved') : tCommon('created'));
      onSaved();
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

  const remove = useMutation({
    mutationFn: () => deleteItem(item!._id),
    onSuccess: () => {
      toast.success(tCommon('deactivatedDone'));
      onSaved();
      onClose();
    },
    onError: () => toast.error(tCommon('error')),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !unitId) {
      toast.error(tCommon('fillRequired'));
      return;
    }
    mutation.mutate();
  };

  return (
    <>
      <Modal onClose={onClose}>
        <form className={css.form} onSubmit={onSubmit}>
          <h2 className={`${css.formTitle} title`}>
            {isEdit ? t('editTitle') : t('newTitle')}
          </h2>

          <div className={css.field}>
            <label className={css.label}>{t('fields.code')} *</label>
            <div className={css.codeRow}>
              <input
                className={css.input}
                value={code}
                onChange={e => setCode(e.target.value)}
              />
              <Button
                type="button"
                className="button button--white"
                onClick={() => setScanning(true)}
              >
                {tQr('scan')}
              </Button>
            </div>
          </div>
          <div className={css.field}>
            <label className={css.label}>{t('fields.name')} *</label>
            <input
              className={css.input}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className={css.field}>
            <label className={css.label}>{t('fields.unit')} *</label>
            <SelectDropdown
              options={units.map(unitLabel)}
              selectedValue={unitText}
              placeholder={t('fields.unitPlaceholder')}
              onSelect={label => {
                const u = unitByLabel.get(label);
                if (u) {
                  setUnitId(u._id);
                  setUnitText(label);
                }
              }}
            />
          </div>
          <div className={css.field}>
            <label className={css.label}>{t('fields.packageLabel')}</label>
            <input
              className={css.input}
              value={packageLabel}
              placeholder={t('fields.packagePlaceholder')}
              onChange={e => setPackageLabel(e.target.value)}
            />
            <span className={css.hint}>{t('fields.packageHint')}</span>
          </div>
          <div className={css.field}>
            <label className={css.label}>{t('fields.unitsPerPackage')}</label>
            <input
              className={css.input}
              type="number"
              min={0}
              step="any"
              value={unitsPerPackage}
              onChange={e => setUnitsPerPackage(e.target.value)}
            />
          </div>
          <div className={css.field}>
            <label className={css.label}>{t('fields.category')}</label>
            <SelectDropdown
              options={categories.map(c => c.name)}
              selectedValue={categoryText}
              placeholder={t('fields.categoryPlaceholder')}
              onSelect={label => {
                const c = categoryByName.get(label);
                if (c) {
                  setCategoryId(c._id);
                  setCategoryText(label);
                }
              }}
            />
          </div>
          <div className={css.field}>
            <label className={css.label}>{t('fields.note')}</label>
            <textarea
              className={css.textarea}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {isEdit && (
            <div className={css.field}>
              <Toggle
                id="item-active"
                checked={active}
                onChange={setActive}
                label={active ? tCommon('active') : tCommon('deactivated')}
              />
            </div>
          )}

          <div className={css.formActions}>
            {isEdit && item?.status === 'active' && (
              <Button
                type="button"
                className="button button--white"
                width="100%"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
              >
                {tCommon('deactivate')}
              </Button>
            )}
            <Button
              type="submit"
              className="button button--blue"
              width="100%"
              disabled={mutation.isPending}
            >
              {isEdit ? tCommon('save') : tCommon('create')}
            </Button>
          </div>
        </form>
      </Modal>

      {scanning && (
        <QrScannerModal
          onScan={scanned => {
            setCode(scanned.trim());
            setScanning(false);
          }}
          onClose={() => setScanning(false)}
        />
      )}
    </>
  );
};

export default ItemsSection;
