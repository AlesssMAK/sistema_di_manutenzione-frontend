import Modal from '@/components/UI/Modal/Modal';
import css from './PlantPartsList.module.css';
import { Plant } from '@/types/plantType';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getAllPartsByPlantId } from '@/lib/api/plantsParts';
import { useStatusOptions, STATUS } from '@/constants/status';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import Filters, { FiltersItem } from '@/components/UI/Filters/Filters';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import { useTranslations } from 'next-intl';
import Pagination from '@/components/UI/Pagination/Pagination';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import PlantPartCard from './PlantPartCard/PlantPartCard';
import Button from '@/components/UI/Button/Button';
import CreateAndEditPlantPartsForm from '@/components/forms/CreateAndEditPlantAndPlantPartsForm/CreateAndEditPlantPartsForm';

interface PlantPartsListProps {
  onClose: () => void;
  plant: Plant;
}

const PlantPartsList = ({ onClose, plant }: PlantPartsListProps) => {
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<STATUS | string>('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [isOpenModal, setIsOpenModal] = useState(false);

  const t = useTranslations('AdminPage.PlantPartsList');
  const tStatuses = useTranslations('Statuses');
  const tNoFound = useTranslations('NoFound');

  const statusOptions = useStatusOptions();
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
      'plantParts',
      plant._id,
      debouncedSearch || undefined,
      status || undefined,
      page,
    ],
    queryFn: () =>
      getAllPartsByPlantId({
        plantId: plant._id,
        search: debouncedSearch,
        status: status as STATUS | undefined,
        page,
      }),
    placeholderData: keepPreviousData,
  });

  console.log(data?.plantParts);

  const onClear = () => {
    setStatus('');
    setSearch('');
  };

  return (
    <div>
      <Modal onClose={onClose}>
        <div className={css.plan_parts_list_container}>
          <div className={css.head_container}>
            <div className={css.title_container}>
              <h1 className="title">{t('title')}</h1>
              <p className="subtitle">
                {t('subtitlePrefix')}: {plant.namePlant} {plant.code}
              </p>
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
              {t('button')}
            </Button>
          </div>
          <Filters items={filters} onClear={onClear} />
          {data?.plantParts.length === 0 && (
            <NoFound
              title={tNoFound('noResultsTitle')}
              message={tNoFound('noResultsMessage')}
              hideIcon
            />
          )}
          {isError && (
            <NoFound
              title={tNoFound('serverErrorTitle')}
              message={tNoFound('serverErrorMessage')}
              hideIcon
            />
          )}
          {isLoading && isFetching && (
            <div className={css.loader_container}>
              <Loader />
            </div>
          )}
          {isSuccess && data?.pagination.totalPages > 1 && (
            <Pagination
              totalPages={data?.pagination.totalPages ?? 0}
              page={page}
              onPageChange={newPage => setPage(newPage)}
            />
          )}
          {isSuccess && data?.plantParts.length > 0 && (
            <div className={css.plant_parts_title_container}>
              <ul className={css.title_list}>
                <li className={`${css.title_list_item} ${css.name}`}>
                  <h3 className={`${css.title} ${css.name}`}>{t('name')}</h3>
                </li>
                <li className={`${css.title_list_item} ${css.code}`}>
                  <h3 className={css.title}>{t('code')}</h3>
                </li>
                <li className={`${css.title_list_item} ${css.status}`}>
                  <h3 className={css.title}>{t('status')}</h3>
                </li>
                <li className={`${css.title_list_item} ${css.action}`}>
                  <h3 className={css.title}>{t('actions')}</h3>
                </li>
              </ul>
              {data.plantParts.map(plantPart => (
                <PlantPartCard
                  plantId={plant._id}
                  plantPart={plantPart}
                  key={plantPart._id}
                />
              ))}
            </div>
          )}
        </div>
        {isOpenModal && (
          <CreateAndEditPlantPartsForm
            plantId={plant._id}
            onClose={() => setIsOpenModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default PlantPartsList;
