'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchSystemSettings } from '@/lib/api/systemSettings';
import { useAuthStore } from '@/lib/store/authStore';

/**
 * Central gate for the warehouse module. Combines the global on/off
 * switch (SystemSettings.warehouse.enabled) with the current user's
 * admin-granted permissions. Used by the nav (show the link) and by the
 * /warehouse page (guard the route + pick which tabs to render).
 */
export const useWarehouseAccess = () => {
  const { user, isAuthenticated } = useAuthStore();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['systemSettings', 'public'],
    queryFn: fetchSystemSettings,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const isAdmin = user?.role === 'admin';
  const moduleEnabled = settings?.warehouse?.enabled === true;
  const canManage = isAdmin || user?.permissions?.canManageWarehouse === true;
  const canOperate = isAdmin || user?.permissions?.canOperateWarehouse === true;

  const canAccess = Boolean(
    isAuthenticated && moduleEnabled && (canManage || canOperate)
  );

  return { canAccess, canManage, canOperate, moduleEnabled, isLoading };
};
