import { useTranslations } from 'next-intl';

export type STATUS = 'active' | 'deactivated';

export const USER_STATUS: STATUS[] = ['active', 'deactivated'];

export const getStatusOptions = () => {
  const t = useTranslations('Statuses');

  return [
    { value: 'all', label: t('all') },
    ...USER_STATUS.map((status: STATUS) => ({
      value: status,
      label: t(status),
    })),
  ];
};
