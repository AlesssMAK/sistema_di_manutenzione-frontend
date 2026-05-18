'use client';

import UsersList from '@/components/Admin/UsersList/UsersList';
import CreateAndEditUserForm from '@/components/forms/CreateAndUpdateUserForm/CreateAndEditUserForm';
import Button from '@/components/UI/Button/Button';
import Filters, { FiltersItem } from '@/components/UI/Filters/Filters';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import { getRoleOptions } from '@/constants/roleType';
import { getStatusOptions, STATUS } from '@/constants/status';
import { getAllUsers } from '@/lib/api/users';
import { usePageStore } from '@/lib/store/pageStore';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import { User, UserRoles } from '@/types/userTypes';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import css from '../UsersAndPlants.module.css';
import Pagination from '@/components/UI/Pagination/Pagination';

const AdminUsersClientPage = () => {
  const [search, setSearch] = useState<string>('');
  const [role, setRole] = useState<UserRoles | string>('');
  const [status, setStatus] = useState<STATUS | string>('');
  const [page, setPage] = useState(1);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [debouncedSearch] = useDebounce(search, 500);

  const tPage = useTranslations('AdminPage');
  const t = useTranslations('AdminPage.Users');
  const tRoles = useTranslations('Roles');
  const tStatuses = useTranslations('Statuses');
  const tNoFound = useTranslations('NoFound');
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
        const value = roleMapper.getValueByLabel(label) ?? '';
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
        const value = statusMapper.getValueByLabel(label) ?? '';
        setStatus(value);
      },
    },
  ];

  const { data, isSuccess, isLoading, isFetching, isError } = useQuery({
    queryKey: [
      'users',
      debouncedSearch || undefined,
      role || undefined,
      status || undefined,
      page,
    ],
    queryFn: () =>
      getAllUsers({
        search: debouncedSearch,
        role: role as UserRoles | undefined,
        status: status as STATUS | undefined,
        page,
      }),
    placeholderData: keepPreviousData,
  });

  const users = data?.users as User[];

  const handleCreateUser = () => {
    setIsOpenModal(true);
  };

  const onClear = () => {
    setRole('');
    setStatus('');
    setSearch('');
  };

  console.log(users);

  return (
    <section className="admin_section">
      <div className={css.head_container}>
        <div className={css.title_container}>
          <h1 className="title">{t('title')}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>
        <Button
          type="button"
          className={`${css.btn} button button--blue`}
          onClick={handleCreateUser}
        >
          <svg width="16" height="16" className={css.btn_icon}>
            <use href="/sprite.svg#plus"></use>
          </svg>
          {t('newUser')}
        </Button>
      </div>
      <Filters items={filters} onClear={onClear} />
      {users?.length === 0 && (
        <NoFound
          title={tNoFound('noResultsTitle')}
          message={tNoFound('noResultsMessage')}
        />
      )}
      {isError && (
        <NoFound
          title={tNoFound('serverErrorTitle')}
          message={tNoFound('serverErrorMessage')}
        />
      )}
      {isLoading && isFetching && (
        <div className={css.loader_container}>
          <Loader />
        </div>
      )}
      {isSuccess && data?.totalPages > 1 && (
        <Pagination
          totalPages={data?.totalPages ?? 0}
          page={page}
          onPageChange={newPage => setPage(newPage)}
        />
      )}
      {isSuccess && users.length > 0 && <UsersList users={users ?? []} />}
      {isOpenModal && (
        <CreateAndEditUserForm
          onClose={() => {
            setIsOpenModal(false);
          }}
        />
      )}
    </section>
  );
};

export default AdminUsersClientPage;
