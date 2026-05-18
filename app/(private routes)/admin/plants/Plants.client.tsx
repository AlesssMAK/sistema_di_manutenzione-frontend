'use client';

import Button from '@/components/UI/Button/Button';
import Filters, { FiltersItem } from '@/components/UI/Filters/Filters';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import { getAllPlants } from '@/lib/api/plants';
import { usePageStore } from '@/lib/store/pageStore';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import css from '../UsersAndPlants.module.css';
import { getStatusOptions, STATUS } from '@/constants/status';
import PlantsList from '@/components/Admin/PlantsList/PalntsList';
import CreateAndEditPlantForm from '@/components/forms/CreateAndEditPlantForm/CreateAndEditPlantForm';
import Pagination from '@/components/UI/Pagination/Pagination';

const AdminPlantsClientPage = () => {
  const [search, setSearch] = useState<string>('');
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<STATUS | string>('');
  const [debouncedSearch] = useDebounce(search, 500);

  const tPage = useTranslations('AdminPage');
  const t = useTranslations('AdminPage.Plants');
  const tNoFound = useTranslations('NoFound');
  const tStatuses = useTranslations('Statuses');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(tPage('titlePageForStore'));
  }, []);

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
      'plants',
      debouncedSearch || undefined,
      status || undefined,
      page,
    ],
    queryFn: () =>
      getAllPlants({
        search: debouncedSearch,
        status: status as STATUS | undefined,
        page,
      }),
    placeholderData: keepPreviousData,
  });

  const onClear = () => {
    setStatus('');
    setSearch('');
  };
  console.log(data);

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
          onClick={() => {
            setIsOpenModal(true);
          }}
        >
          <svg width="16" height="16" className={css.btn_icon}>
            <use href="/sprite.svg#plus"></use>
          </svg>
          {t('newMachine')}
        </Button>
      </div>
      <Filters items={filters} onClear={onClear} />
      {data?.plants.length === 0 && (
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
      {isSuccess && data?.plants.length > 0 && (
        <PlantsList plants={data?.plants ?? []} />
      )}
      {isSuccess && data?.pagination.totalPages > 1 && (
        <Pagination
          totalPages={data?.pagination.totalPages ?? 0}
          page={page}
          onPageChange={newPage => setPage(newPage)}
        />
      )}

      {isOpenModal && (
        <CreateAndEditPlantForm
          onClose={() => {
            setIsOpenModal(false);
          }}
        />
      )}
    </section>
  );
};

export default AdminPlantsClientPage;
