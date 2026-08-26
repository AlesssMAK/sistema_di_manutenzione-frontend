'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSystemSettings } from '@/lib/api/systemSettings';
import { getAllWarehouses } from '@/lib/api/warehouse';
import { useAuthStore } from '@/lib/store/authStore';
import type { Warehouse } from '@/types/warehouseType';

export type WarehouseContext = 'management' | 'maintenance';

// Resolves the candidate warehouses for a context and whether a picker
// should be shown. Mirrors the backend rule.
//
// The multiWarehouse flag is the master gate: while it is OFF the shop
// runs on ONE warehouse and every context collapses to the default
// warehouse (picker hidden everywhere). Only when it is ON do the
// per-user (operations) and per-role (faults) rules widen the sets.
//   - 'management' (keeper: Carico/Giacenze/Rettifica/transfer) → all
//     active warehouses narrowed by the user's allowedWarehouses.
//   - 'maintenance' (technician closing a fault) → the warehouses
//     assigned to the user's ROLE for fault work; keeper rights never
//     widen this. A role with none configured falls back to the default.
export function useWarehouseContext(context: WarehouseContext) {
  const { user, isAuthenticated } = useAuthStore();

  const { data: settings } = useQuery({
    queryKey: ['systemSettings', 'public'],
    queryFn: fetchSystemSettings,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const moduleEnabled = settings?.warehouse?.enabled === true;

  const { data: whData, isLoading } = useQuery({
    queryKey: ['warehouse', 'warehouses', 'active-pool'],
    queryFn: () => getAllWarehouses({ status: 'active', perPage: 200 }),
    enabled: isAuthenticated && moduleEnabled,
  });

  const candidates = useMemo<Warehouse[]>(() => {
    const all = whData?.warehouses ?? [];
    if (all.length === 0) return [];

    // The single warehouse used whenever the choice is implicit.
    const defaultId = settings?.warehouse?.defaultWarehouseId ?? null;
    const byCode = [...all].sort((a, b) => a.code.localeCompare(b.code));
    const effectiveDefault =
      all.find(w => w._id === defaultId) ?? byCode[0] ?? null;
    const single = effectiveDefault ? [effectiveDefault] : [];

    // Single-warehouse mode: every context collapses to the default.
    if (settings?.warehouse?.multiWarehouse !== true) return single;

    if (context === 'maintenance') {
      const byRole = settings?.warehouse?.faultWarehousesByRole ?? [];
      const ids =
        byRole.find(e => e.role === user?.role)?.warehouseIds ?? [];
      if (ids.length === 0) return single;
      return all.filter(w => ids.includes(w._id));
    }

    // Management: narrow by the user's allowedWarehouses (admin/empty = all).
    const allowed = user?.allowedWarehouses ?? [];
    if (user?.role === 'admin' || allowed.length === 0) return all;
    return all.filter(w => allowed.includes(w._id));
  }, [whData, settings, context, user]);

  // The single warehouse to use implicitly when the picker is hidden.
  const single = candidates.length === 1 ? candidates[0] : null;

  return {
    candidates,
    /** The lone warehouse when there is exactly one candidate, else null. */
    single,
    /** Show the warehouse picker only when the choice is ambiguous. */
    showPicker: candidates.length > 1,
    isLoading,
  };
}
