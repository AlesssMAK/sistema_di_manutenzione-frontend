import { UserRoles } from '@/types/userTypes';
import { useTranslations } from 'next-intl';

export const USER_ROLES: UserRoles[] = [
  'admin',
  'operator',
  'manager',
  'maintenanceWorker',
  'safety',
];

export const getRoleOptions = () => {
  const t = useTranslations('Roles');

  return [
    { value: 'all', label: t('all') },
    ...USER_ROLES.map((role: UserRoles) => ({
      value: role,
      label: t(role),
    })),
  ];
};
