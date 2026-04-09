import { UserStatus } from '@/types/userTypes';
import { useTranslations } from 'next-intl';

export const USER_STATUS: UserStatus[] = ['active', 'inactive', 'deactivated'];

export const getStatusOptions = () => {
  const t = useTranslations('Statuses');

  return [
    { value: 'all', label: t('all') },
    ...USER_STATUS.map((status: UserStatus) => ({
      value: status,
      label: t(status),
    })),
  ];
};
