'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
} from '@/lib/api/warehouse';
import type { Category } from '@/types/warehouseType';
import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import css from '../WarehouseUnitsManager/WarehouseUnitsManager.module.css';

// Compact item-categories manager for the admin settings card — a small
// stable reference list, so an add-row + chips beats a full CRUD page.
// The item form and catalog filter just consume these.
const WarehouseCategoriesManager = () => {
  const t = useTranslations('AdminPage.SystemSettings.warehouse.categories');
  const queryClient = useQueryClient();

  const [name, setName] = useState('');

  const { data } = useQuery({
    queryKey: ['warehouse', 'categories', 'manage'],
    queryFn: () => getAllCategories({ perPage: 200 }),
  });
  const categories: Category[] = data?.categories ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['warehouse', 'categories'] });

  const onError = (err: unknown) =>
    toast.error(
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : t('error')
    );

  const add = useMutation({
    mutationFn: () => createCategory({ name: name.trim() }),
    onSuccess: () => {
      toast.success(t('created'));
      setName('');
      invalidate();
    },
    onError,
  });

  const deactivate = useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: () => {
      toast.success(t('deactivated'));
      invalidate();
    },
    onError,
  });

  const reactivate = useMutation({
    mutationFn: (categoryId: string) =>
      updateCategory({ categoryId, data: { status: 'active' } }),
    onSuccess: () => {
      toast.success(t('activated'));
      invalidate();
    },
    onError,
  });

  const onAdd = () => {
    if (!name.trim()) {
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

      {categories.length === 0 ? (
        <p className={css.empty}>{t('empty')}</p>
      ) : (
        <ul className={css.chips}>
          {categories.map(c => {
            const isActive = c.status === 'active';
            return (
              <li
                key={c._id}
                className={`${css.chip} ${isActive ? '' : css.chipDeactivated}`}
              >
                <span>{c.name}</span>
                {isActive ? (
                  <button
                    type="button"
                    className={css.chipBtn}
                    onClick={() => deactivate.mutate(c._id)}
                    disabled={deactivate.isPending}
                  >
                    {t('deactivate')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={css.chipBtn}
                    onClick={() => reactivate.mutate(c._id)}
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

export default WarehouseCategoriesManager;
