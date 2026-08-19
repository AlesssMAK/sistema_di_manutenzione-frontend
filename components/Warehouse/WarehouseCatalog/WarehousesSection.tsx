'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useDebounce } from 'use-debounce';
import toast from 'react-hot-toast';
import {
  createWarehouse,
  deleteWarehouse,
  getAllWarehouses,
  updateWarehouse,
} from '@/lib/api/warehouse';
import type { Warehouse } from '@/types/warehouseType';
import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import Modal from '@/components/UI/Modal/Modal';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import Toggle from '@/components/UI/Toggle/Toggle';
import css from './Catalog.module.css';

const PER_PAGE = 10;

const WarehousesSection = () => {
  const t = useTranslations('WarehousePage.catalog.warehouses');
  const tCommon = useTranslations('WarehousePage.catalog.common');
  const tNoFound = useTranslations('NoFound');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['warehouse', 'warehouses', debouncedSearch || undefined, page],
    queryFn: () =>
      getAllWarehouses({ search: debouncedSearch, page, perPage: PER_PAGE }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['warehouse', 'warehouses'] });

  const close = () => setIsOpen(false);
  const warehouses = data?.warehouses ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;

  return (
    <div className={css.section}>
      <div className={css.head}>
        <div className={css.searchWrap}>
          <Input
            type="text"
            value={search}
            placeholder={tCommon('searchPlaceholder')}
            onChange={(e) => setSearch(e.target.value)}
            style={{ height: '36px', borderRadius: '6px', background: '#f3f3f5', border: 'none' }}
          />
        </div>
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

      {isLoading ? (
        <div className={css.loaderWrap}>
          <Loader />
        </div>
      ) : isError ? (
        <NoFound title={tNoFound('serverErrorTitle')} message={tNoFound('serverErrorMessage')} hideIcon />
      ) : warehouses.length === 0 ? (
        <NoFound title={tNoFound('emptyTitle')} message={t('empty')} hideIcon />
      ) : (
        <ul className={css.list}>
          {warehouses.map((wh) => (
            <li
              key={wh._id}
              className={`${css.row} ${wh.status === 'deactivated' ? css.rowDeactivated : ''}`}
            >
              <div className={css.rowMain}>
                <span className={css.rowName}>
                  {wh.name}
                  <span className={css.rowCode}>({wh.code})</span>
                </span>
                {wh.location && <div className={css.rowSub}>{wh.location}</div>}
              </div>
              {wh.status === 'deactivated' && (
                <span className={css.badge}>{tCommon('deactivated')}</span>
              )}
              <div className={css.rowActions}>
                <button
                  type="button"
                  className={css.iconBtn}
                  onClick={() => {
                    setEditing(wh);
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
        <WarehouseFormModal warehouse={editing} onClose={close} onSaved={invalidate} />
      )}
    </div>
  );
};

interface WarehouseFormModalProps {
  warehouse: Warehouse | null;
  onClose: () => void;
  onSaved: () => void;
}

const WarehouseFormModal = ({ warehouse, onClose, onSaved }: WarehouseFormModalProps) => {
  const t = useTranslations('WarehousePage.catalog.warehouses');
  const tCommon = useTranslations('WarehousePage.catalog.common');
  const isEdit = Boolean(warehouse);

  const [code, setCode] = useState(warehouse?.code ?? '');
  const [name, setName] = useState(warehouse?.name ?? '');
  const [location, setLocation] = useState(warehouse?.location ?? '');
  const [active, setActive] = useState(
    warehouse ? warehouse.status === 'active' : true
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit && warehouse) {
        return updateWarehouse({
          warehouseId: warehouse._id,
          data: {
            code: code.trim(),
            name: name.trim(),
            location: location.trim(),
            status: active ? 'active' : 'deactivated',
          },
        });
      }
      return createWarehouse({
        code: code.trim(),
        name: name.trim(),
        location: location.trim() || undefined,
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
    mutationFn: () => deleteWarehouse(warehouse!._id),
    onSuccess: () => {
      toast.success(tCommon('deactivatedDone'));
      onSaved();
      onClose();
    },
    onError: () => toast.error(tCommon('error')),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
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
          <label className={css.label}>{t('fields.location')}</label>
          <input className={css.input} value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        {isEdit && (
          <div className={css.field}>
            <Toggle
              id="warehouse-active"
              checked={active}
              onChange={setActive}
              label={active ? tCommon('active') : tCommon('deactivated')}
            />
          </div>
        )}

        <div className={css.formActions}>
          {isEdit && warehouse?.status === 'active' && (
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

export default WarehousesSection;
