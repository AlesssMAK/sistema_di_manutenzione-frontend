'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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
import css from './WarehouseUnitsManager.module.css';

// Compact units-of-measure manager for the admin settings card. Units
// are a small, stable reference list, so a single add-row + chips beats
// a full CRUD page. The warehouse item form just consumes these.
const WarehouseUnitsManager = () => {
  const t = useTranslations('AdminPage.SystemSettings.warehouse.units');
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [allowsDecimals, setAllowsDecimals] = useState(false);

  const { data } = useQuery({
    queryKey: ['warehouse', 'units', 'manage'],
    queryFn: () => getAllUnits({ perPage: 200 }),
  });
  const units: Unit[] = data?.units ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['warehouse', 'units'] });

  const onError = (err: unknown) =>
    toast.error(
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : t('error')
    );

  const add = useMutation({
    mutationFn: () =>
      createUnit({ code: code.trim(), name: name.trim(), allowsDecimals }),
    onSuccess: () => {
      toast.success(t('created'));
      setCode('');
      setName('');
      setAllowsDecimals(false);
      invalidate();
    },
    onError,
  });

  const deactivate = useMutation({
    mutationFn: (unitId: string) => deleteUnit(unitId),
    onSuccess: () => {
      toast.success(t('deactivated'));
      invalidate();
    },
    onError,
  });

  const reactivate = useMutation({
    mutationFn: (unitId: string) =>
      updateUnit({ unitId, data: { status: 'active' } }),
    onSuccess: () => {
      toast.success(t('activated'));
      invalidate();
    },
    onError,
  });

  const onAdd = () => {
    if (!code.trim() || !name.trim()) {
      toast.error(t('fillRequired'));
      return;
    }
    add.mutate();
  };

  return (
    <div className={css.section}>
      <div className={css.head}>
        <h2 className={css.title}>{t('title')}</h2>
      </div>

      <div className={css.controls}>
        <div className={`${css.control} ${css.controlNarrow}`}>
          <label className={css.controlLabel}>{t('symbol')}</label>
          <Input
            value={code}
            onChange={e => setCode(e.target.value)}
            style={{ height: '36px', borderRadius: '6px' }}
          />
        </div>
        <div className={css.control}>
          <label className={css.controlLabel}>{t('name')}</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ height: '36px', borderRadius: '6px' }}
          />
        </div>
        <Button
          type="button"
          className="button button--blue"
          onClick={onAdd}
          disabled={add.isPending}
          height={36}
        >
          {t('add')}
        </Button>
      </div>

      <label className={css.decimalsRow}>
        <input
          type="checkbox"
          checked={allowsDecimals}
          onChange={e => setAllowsDecimals(e.target.checked)}
        />
        <span>{t('allowDecimals')}</span>
      </label>

      {units.length === 0 ? (
        <p className={css.empty}>{t('empty')}</p>
      ) : (
        <ul className={css.chips}>
          {units.map(u => {
            const isActive = u.status === 'active';
            return (
              <li
                key={u._id}
                className={`${css.chip} ${isActive ? '' : css.chipDeactivated}`}
              >
                <span>
                  {u.name} <span className={css.chipCode}>({u.code})</span>
                  {u.allowsDecimals && (
                    <span
                      className={css.chipDecimals}
                      title={t('allowDecimals')}
                    >
                      {' '}
                      0,5
                    </span>
                  )}
                </span>
                {isActive ? (
                  <button
                    type="button"
                    className={css.chipBtn}
                    onClick={() => deactivate.mutate(u._id)}
                    disabled={deactivate.isPending}
                  >
                    {t('deactivate')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={css.chipBtn}
                    onClick={() => reactivate.mutate(u._id)}
                    disabled={reactivate.isPending}
                  >
                    {t('activate')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default WarehouseUnitsManager;
