'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useDebounce } from 'use-debounce';
import toast from 'react-hot-toast';
import {
  createUnit,
  deleteUnit,
  getAllUnits,
  updateUnit,
} from '@/lib/api/warehouse';
import type { Unit } from '@/types/warehouseType';
import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import Modal from '@/components/UI/Modal/Modal';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import Pagination from '@/components/UI/Pagination/Pagination';
import Toggle from '@/components/UI/Toggle/Toggle';
import css from './Catalog.module.css';

const PER_PAGE = 10;

const UnitsSection = () => {
  const t = useTranslations('WarehousePage.catalog.units');
  const tCommon = useTranslations('WarehousePage.catalog.common');
  const tNoFound = useTranslations('NoFound');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['warehouse', 'units', debouncedSearch || undefined, page],
    queryFn: () =>
      getAllUnits({ search: debouncedSearch, page, perPage: PER_PAGE }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['warehouse', 'units'] });

  const openCreate = () => {
    setEditing(null);
    setIsOpen(true);
  };
  const openEdit = (unit: Unit) => {
    setEditing(unit);
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  const units = data?.units ?? [];
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
        <Button type="button" className={`${css.newBtn} button button--blue`} onClick={openCreate}>
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
      ) : units.length === 0 ? (
        <NoFound title={tNoFound('emptyTitle')} message={t('empty')} hideIcon />
      ) : (
        <ul className={css.list}>
          {units.map((unit) => (
            <li
              key={unit._id}
              className={`${css.row} ${unit.status === 'deactivated' ? css.rowDeactivated : ''}`}
            >
              <div className={css.rowMain}>
                <span className={css.rowName}>
                  {unit.name}
                  <span className={css.rowCode}>({unit.code})</span>
                </span>
              </div>
              {unit.status === 'deactivated' && (
                <span className={css.badge}>{tCommon('deactivated')}</span>
              )}
              <div className={css.rowActions}>
                <button
                  type="button"
                  className={css.iconBtn}
                  onClick={() => openEdit(unit)}
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
        <UnitFormModal unit={editing} onClose={close} onSaved={invalidate} />
      )}
    </div>
  );
};

interface UnitFormModalProps {
  unit: Unit | null;
  onClose: () => void;
  onSaved: () => void;
}

const UnitFormModal = ({ unit, onClose, onSaved }: UnitFormModalProps) => {
  const t = useTranslations('WarehousePage.catalog.units');
  const tCommon = useTranslations('WarehousePage.catalog.common');
  const isEdit = Boolean(unit);

  const [code, setCode] = useState(unit?.code ?? '');
  const [name, setName] = useState(unit?.name ?? '');
  const [active, setActive] = useState(unit ? unit.status === 'active' : true);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit && unit) {
        return updateUnit({
          unitId: unit._id,
          data: {
            code: code.trim(),
            name: name.trim(),
            status: active ? 'active' : 'deactivated',
          },
        });
      }
      return createUnit({ code: code.trim(), name: name.trim() });
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
    mutationFn: () => deleteUnit(unit!._id),
    onSuccess: () => {
      toast.success(tCommon('deactivatedDone'));
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

        {isEdit && (
          <div className={css.field}>
            <Toggle
              id="unit-active"
              checked={active}
              onChange={setActive}
              label={active ? tCommon('active') : tCommon('deactivated')}
            />
          </div>
        )}

        <div className={css.formActions}>
          {isEdit && unit?.status === 'active' && (
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

export default UnitsSection;
