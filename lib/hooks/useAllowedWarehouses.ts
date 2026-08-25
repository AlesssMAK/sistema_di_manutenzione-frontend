import { useMemo } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import type { Warehouse } from '@/types/warehouseType';

// Narrows a warehouse list to the ones the current user may operate on.
// Admins and users with no restriction (empty allowedWarehouses) see
// them all. Mirrors the backend enforcement so the UI never offers a
// warehouse the move would be rejected for.
export function useAllowedWarehouses(warehouses: Warehouse[]): Warehouse[] {
  const { user } = useAuthStore();
  return useMemo(() => {
    const allowed = user?.allowedWarehouses ?? [];
    if (user?.role === 'admin' || allowed.length === 0) return warehouses;
    return warehouses.filter(w => allowed.includes(w._id));
  }, [warehouses, user]);
}
