'use client';

import { Plant } from '@/types/plantType';
import PlantCard from './PlantCard/PlantCard';
import css from './PlantsList.module.css';
import { useTranslations } from 'next-intl';

interface PlantsListProps {
  plants: Plant[];
}

const PlantsList = ({ plants }: PlantsListProps) => {
  const t = useTranslations('AdminPage.PlantsList');

  return (
    <div className={css.plants_container}>
      <ul className={css.title_list}>
        <li className={`${css.title_list_item} ${css.name}`}>
          <h3 className={`${css.title} ${css.name}`}>{t('name')}</h3>
        </li>
        <li className={`${css.title_list_item} ${css.code}`}>
          <h3 className={css.title}>{t('code')}</h3>
        </li>
        <li className={`${css.title_list_item} ${css.location}`}>
          <h3 className={css.title}>{t('location')}</h3>
        </li>
        <li className={`${css.title_list_item} ${css.status}`}>
          <h3 className={css.title}>{t('status')}</h3>
        </li>
        <li className={`${css.title_list_item} ${css.action}`}>
          <h3 className={css.title}>{t('actions')}</h3>
        </li>
      </ul>
      {plants.map(plant => (
        <PlantCard key={plant._id} plant={plant} />
      ))}
    </div>
  );
};

export default PlantsList;
