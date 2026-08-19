'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useDebounce } from 'use-debounce';
import toast from 'react-hot-toast';
import {
  createItem,
  deleteItem,
  getAllItems,
  getAllUnits,
  updateItem,
} from '@/lib/api/warehouse';
import type { InventoryItem, Unit } from '@/types/warehouseType';
import Button from '@/components/UI/Button/Button';
import Modal from '@/components/UI/Modal/Modal';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import Toggle from '@/components/UI/Toggle/Toggle';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import Filters, { type FiltersItem } from '@/components/UI/Filters/Filters';
import { useStatusOptions } from '@/constants/status';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import css from './Catalog.module.css';

const PER_PAGE = 10;

const unitLabel = (u: { name: string; code: string }) => `${u.name} (${u.code})`;

// unitId is populated on read, a plain id on write.
const unitIdOf = (item: InventoryItem): string =>
  typeof item.unitId === 'string' ? item.unitId : item.unitId._id;
const unitTextOf = (item: InventoryItem): string =>
  typeof item.unitId === 'string' ? '' : unitLabel(item.unitId);

const ItemsSection = () => {
  const t = useTranslations('WarehousePage.catalog.items');
  const tCommon = useTranslations('WarehousePage.catalog.common');
  const tNoFound = useTranslations('NoFound');
  const tStatuses = useTranslations('Statuses');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const statusMapper = createOptionMapper(useStatusOptions());

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
      id: 'status',
      type: 'select',
      label: tCommon('statusLabel'),
      value: statusMapper.getLabelByValue(status) ?? tStatuses('all'),
      options: statusMapper.labelsArray,
      onSelect: (label) => setStatus(statusMapper.getValueByLabel(label) ?? ''),
    },
  ];
  const onClear = () => {
    setSearch('');
    setStatus('');
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['warehouse', 'items', debouncedSearch || undefined, status, page],
    queryFn: () =>
      getAllItems({ search: debouncedSearch, status, page, perPage: PER_PAGE }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['warehouse', 'items'] });

  const close = () => setIsOpen(false);
  const items = data?.items ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;

  return (
    <div className={css.section}>
      <div className={css.head}>
        <Button
          type="button"
          className={`${css.newBtn} button button--blue`}
          onClick={() => {
            setEditing(null);
            setIsOpen(true);
          }}
        >
          <svg width="16" height="16">
            <use href="/sprite.svg#plus" />
          </svg>
          {t('new')}
        </Button>
      </div>
      <div className={css.filtersGap}>
        <Filters items={filters} onClear={onClear} />
      </div>

      {isLoading ? (
        <div className={css.loaderWrap}>
          <Loader />
        </div>
      ) : isError ? (
        <NoFound title={tNoFound('serverErrorTitle')} message={tNoFound('serverErrorMessage')} hideIcon />
      ) : items.length === 0 ? (
        <NoFound title={tNoFound('emptyTitle')} message={t('empty')} hideIcon />
      ) : (
        <ul className={css.list}>
          {items.map((item) => (
            <li
              key={item._id}
              className={`${css.row} ${item.status === 'deactivated' ? css.rowDeactivated : ''}`}
            >
              <div className={css.rowMain}>
                <span className={css.rowName}>
                  {item.name}
                  <span className={css.rowCode}>({item.code})</span>
                </span>
                <div className={css.rowSub}>
                  {typeof item.unitId !== 'string' && unitLabel(item.unitId)}
                  {item.category ? ` · ${item.category}` : ''}
                </div>
              </div>
              {item.status === 'deactivated' && (
                <span className={css.badge}>{tCommon('deactivated')}</span>
              )}
              <div className={css.rowActions}>
                <button
                  type="button"
                  className={css.iconBtn}
                  onClick={() => {
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
          <Pagination totalPages={totalPages} page={page} onPageChange={setPage} />
        </div>
      )}

      {isOpen && (
        <ItemFormModal item={editing} onClose={close} onSaved={invalidate} />
      )}
    </div>
  );
};

interface ItemFormModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: () => void;
}

const ItemFormModal = ({ item, onClose, onSaved }: ItemFormModalProps) => {
  const t = useTranslations('WarehousePage.catalog.items');
  const tCommon = useTranslations('WarehousePage.catalog.common');
  const isEdit = Boolean(item);

  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState(item?.category ?? '');
  const [note, setNote] = useState(item?.note ?? '');
  const [unitId, setUnitId] = useState(item ? unitIdOf(item) : '');
  const [unitText, setUnitText] = useState(item ? unitTextOf(item) : '');
  const [active, setActive] = useState(item ? item.status === 'active' : true);

  // Active units only — the pool for the picker.
  const { data: unitsData } = useQuery({
    queryKey: ['warehouse', 'units', 'active-pool'],
    queryFn: () => getAllUnits({ status: 'active', perPage: 200 }),
  });
  const units: Unit[] = useMemo(() => unitsData?.units ?? [], [unitsData]);
  const unitByLabel = useMemo(() => {
    const map = new Map<string, Unit>();
    units.forEach((u) => map.set(unitLabel(u), u));
    return map;
  }, [units]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit && item) {
        return updateItem({
          itemId: item._id,
          data: {
            code: code.trim(),
            name: name.trim(),
            category: category.trim(),
            unitId,
            note: note.trim(),
            status: active ? 'active' : 'deactivated',
          },
        });
      }
      return createItem({
        code: code.trim(),
        name: name.trim(),
        category: category.trim() || undefined,
        unitId,
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
    <Modal onClose={onClose}>
      <form className={css.form} onSubmit={onSubmit}>
        <h2 className={`${css.formTitle} title`}>
          {isEdit ? t('editTitle') : t('newTitle')}
        </h2>

        <div className={css.field}>
          <label className={css.label}>{t('fields.code')} *</label>
          <input className={css.input} value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className={css.field}>
          <label className={css.label}>{t('fields.name')} *</label>
          <input className={css.input} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className={css.field}>
          <label className={css.label}>{t('fields.unit')} *</label>
          <SelectDropdown
            options={units.map(unitLabel)}
            selectedValue={unitText}
            placeholder={t('fields.unitPlaceholder')}
            onSelect={(label) => {
              const u = unitByLabel.get(label);
              if (u) {
                setUnitId(u._id);
                setUnitText(label);
              }
            }}
          />
        </div>
        <div className={css.field}>
          <label className={css.label}>{t('fields.category')}</label>
          <input className={css.input} value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className={css.field}>
          <label className={css.label}>{t('fields.note')}</label>
          <textarea className={css.textarea} value={note} onChange={(e) => setNote(e.target.value)} />
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
  );
};

export default ItemsSection;
