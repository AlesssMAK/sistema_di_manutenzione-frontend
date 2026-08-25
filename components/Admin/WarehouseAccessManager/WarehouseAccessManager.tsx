'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { getAllUsers, updateUser } from '@/lib/api/users';
import { getAllWarehouses } from '@/lib/api/warehouse';
import type { Warehouse } from '@/types/warehouseType';
import WarehousesMultiSelect from '../WarehousesMultiSelect/WarehousesMultiSelect';
import css from './WarehouseAccessManager.module.css';

// Per-user warehouse access editor. `canOperateWarehouse` (granted in
// the section below) stays the general gate; here the admin narrows
// WHICH warehouses each operator may use. Empty = all.
const WarehouseAccessManager = () => {
  const t = useTranslations('AdminPage.SystemSettings.warehouse.access');
  const queryClient = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ['users', 'warehouse-access'],
    queryFn: () => getAllUsers({ status: 'active', perPage: 200 }),
  });
  // Admins are never restricted, so only non-admin operators are listed.
  const operators = useMemo(
    () =>
      (usersData?.users ?? []).filter(
        u => u.role !== 'admin' && u.permissions?.canOperateWarehouse
      ),
    [usersData]
  );

  const { data: whData } = useQuery({
    queryKey: ['warehouse', 'warehouses', 'active-pool'],
    queryFn: () => getAllWarehouses({ status: 'active', perPage: 200 }),
  });
  const warehouses: Warehouse[] = useMemo(
    () => whData?.warehouses ?? [],
    [whData]
  );

  const save = useMutation({
    mutationFn: ({ userId, ids }: { userId: string; ids: string[] }) =>
      updateUser({ userId, data: { allowedWarehouses: ids } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: () => toast.error(t('error')),
  });

  return (
    <div className={css.section}>
      <div className={css.head}>
        <h2 className={css.title}>{t('title')}</h2>
        <p className={css.subtitle}>{t('subtitle')}</p>
      </div>

      {operators.length === 0 ? (
        <p className={css.empty}>{t('empty')}</p>
      ) : (
        <ul className={css.list}>
          {operators.map(u => (
            <li key={u._id} className={css.row}>
              <span className={css.name}>{u.fullName}</span>
              <WarehousesMultiSelect
                warehouses={warehouses}
                selectedIds={u.allowedWarehouses ?? []}
                onChange={ids => save.mutate({ userId: u._id, ids })}
                placeholder={t('addWarehouse')}
                emptyText={t('allWarehouses')}
                removeLabel={t('remove')}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WarehouseAccessManager;
