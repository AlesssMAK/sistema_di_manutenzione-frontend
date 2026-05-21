import { useTranslations } from 'next-intl';

export type STATUS = 'active' | 'deactivated';

export const STATUS_OPTIONS: STATUS[] = ['active', 'deactivated'];

export const getStatusOptions = () => {
  const t = useTranslations('Statuses');

  return [
    { value: 'all', label: t('all') },
    ...STATUS_OPTIONS.map((status: STATUS) => ({
      value: status,
      label: t(status),
    })),
  ];
};
