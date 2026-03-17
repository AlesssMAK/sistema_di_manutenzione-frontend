import { roleRoutes } from '@/constants/roleRoutes';

export const isAllowed = (role: string | undefined, pathname: string) => {
  if (!role) return false;

  const allowed = roleRoutes[role];

  if (!allowed) return false;

  return allowed.some(route => pathname.startsWith(route));
};
