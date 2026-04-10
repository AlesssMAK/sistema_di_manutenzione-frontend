'use client';

import { usePageStore } from '@/lib/store/pageStore';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import css from './Users.module.css';
import Button from '@/components/UI/Button/Button';
import Filters, { FiltersItem } from '@/components/UI/Filters/Filters';
import { getRoleOptions } from '@/constants/roleType';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import { getStatusOptions } from '@/constants/userStatus';

const AdminUsersClientPage = () => {
  const [search, setSearch] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const t = useTranslations('AdminPage');
  const tRoles = useTranslations('Roles');
  const tStatuses = useTranslations('Statuses');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  const roleOptions = getRoleOptions();
  const roleMapper = createOptionMapper(roleOptions);

  const statusOptions = getStatusOptions();
  const statusMapper = createOptionMapper(statusOptions);

  const filters: FiltersItem[] = [
    {
      id: 'search',
      type: 'input',
      label: t('search'),
      value: search,
      placeholder: t('searchPlaceholder'),
      onChange: setSearch,
      icon: 'search',
    },
    {
      id: 'role',
      type: 'select',
      label: t('role'),
      value: roleMapper.getLabelByValue(role) ?? tRoles('all'),
      options: roleMapper.labelsArray,
      onSelect: label => {
        const value = roleMapper.getValueByLabel(label) ?? 'all';
        setRole(value);
      },
    },
    {
      id: 'status',
      type: 'select',
      label: t('status'),
      value: statusMapper.getLabelByValue(status) ?? tStatuses('all'),
      options: statusMapper.labelsArray,
      onSelect: label => {
        const value = statusMapper.getValueByLabel(label) ?? 'all';
        setStatus(value);
      },
    },
  ];

  console.log(role);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, []);
  return (
    <section className={css.section}>
      <div className={css.head_container}>
        <div className={css.title_container}>
          <h1 className="title">{t('title')}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>
        <Button type="button" className={`${css.btn} button button--blue`}>
          <svg width="16" height="16" className={css.btn_icon}>
            <use href="/sprite.svg#plus"></use>
          </svg>
          {t('newMachine')}
        </Button>
      </div>
      <Filters items={filters} />
    </section>
  );
};

export default AdminUsersClientPage;
