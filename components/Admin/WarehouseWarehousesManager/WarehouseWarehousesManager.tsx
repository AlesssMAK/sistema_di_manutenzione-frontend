'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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
import css from '../WarehouseUnitsManager/WarehouseUnitsManager.module.css';

// Compact warehouses (locations) manager for the admin settings card —
// a stable reference list, so an add-row + chips beats a full CRUD page.
// The warehouse page just picks from these to move stock.
const WarehouseWarehousesManager = () => {
  const t = useTranslations('AdminPage.SystemSettings.warehouse.warehouses');
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const { data } = useQuery({
    queryKey: ['warehouse', 'warehouses', 'manage'],
    queryFn: () => getAllWarehouses({ perPage: 200 }),
  });
  const warehouses: Warehouse[] = data?.warehouses ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['warehouse', 'warehouses'] });

  const onError = (err: unknown) =>
    toast.error(
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : t('error')
    );

  const add = useMutation({
    mutationFn: () =>
      createWarehouse({
        code: code.trim(),
        name: name.trim(),
        location: location.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(t('created'));
      setCode('');
      setName('');
      setLocation('');
      invalidate();
    },
    onError,
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => deleteWarehouse(id),
    onSuccess: () => {
      toast.success(t('deactivated'));
      invalidate();
    },
    onError,
  });

  const reactivate = useMutation({
    mutationFn: (id: string) =>
      updateWarehouse({ warehouseId: id, data: { status: 'active' } }),
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
          <label className={css.controlLabel}>{t('code')}</label>
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
        <div className={css.control}>
          <label className={css.controlLabel}>{t('location')}</label>
          <Input
            value={location}
            onChange={e => setLocation(e.target.value)}
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

      {warehouses.length === 0 ? (
        <p className={css.empty}>{t('empty')}</p>
      ) : (
        <ul className={css.chips}>
          {warehouses.map(w => {
            const isActive = w.status === 'active';
            return (
              <li
                key={w._id}
                className={`${css.chip} ${isActive ? '' : css.chipDeactivated}`}
              >
                <span>
                  {w.name} <span className={css.chipCode}>({w.code})</span>
                </span>
                {isActive ? (
                  <button
                    type="button"
                    className={css.chipBtn}
                    onClick={() => deactivate.mutate(w._id)}
                    disabled={deactivate.isPending}
                  >
                    {t('deactivate')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={css.chipBtn}
                    onClick={() => reactivate.mutate(w._id)}
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

export default WarehouseWarehousesManager;
