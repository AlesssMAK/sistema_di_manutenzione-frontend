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
import { getAllUsers } from '@/lib/api/users';
import { User } from '@/types/userTypes';
import UsersList from '@/components/Admin/UsersList/UsersList';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';

const AdminUsersClientPage = () => {
  const [search, setSearch] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  // const [users, setUsers] = useState<User[]>([]);
  const [debouncedSearch] = useDebounce(search, 500);

  const tPage = useTranslations('AdminPage');
  const t = useTranslations('AdminPage.Users');
  const tRoles = useTranslations('Roles');
  const tStatuses = useTranslations('Statuses');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(tPage('titlePageForStore'));
  }, []);

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
  const {
    data: users,
    isSuccess,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => getAllUsers(),
    placeholderData: keepPreviousData,
  });

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
          {t('newUser')}
        </Button>
      </div>
      <Filters items={filters} />
      <UsersList users={users ?? []} />
    </section>
  );
};

export default AdminUsersClientPage;
