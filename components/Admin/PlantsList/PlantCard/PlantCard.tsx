'use client';

import Button from '@/components/UI/Button/Button';
import css from './PlantCard.module.css';
import { useState } from 'react';
import { Plant } from '@/types/plantType';
import { getStatusOptions, STATUS } from '@/constants/status';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PlantCardProps {
  plant: Plant;
}

interface UpdateStatus {
  userId: string;
  status: STATUS;
}

const PlantCard = ({ plant }: PlantCardProps) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations('AdminPage.PlantsList');
  const queryClient = useQueryClient();

  //   const mutation = useMutation({
  //     mutationFn: ({ userId, data }: UpdateUserRequest) =>
  //       updateUser({ userId, data }),
  //     onSuccess: () => {
  //       queryClient.invalidateQueries({ queryKey: ['users'] });
  //     },
  //   });

  const statuses = getStatusOptions();
  const status = statuses.find(status => status.value === plant.status);

  const handleStatusUpdate = async ({ userId, status }: UpdateStatus) => {
    //   mutation.mutate({ userId, data: { status } });
  };

  return (
    <div className={css.plant_card_container}>
      <div className={css.head_container}>
        <div className={css.plant_card_item_name}>
          <h3 className={css.title}>{t('name')}</h3>
          <p className={css.name}>{plant.namePlant}</p>
        </div>
        <div className={css.plant_card_item_code}>
          <h3 className={css.title}>{t('code')}</h3>
          <p className={css.code}>{plant.code}</p>
        </div>
      </div>
      <div className={css.plant_card_item_location}>
        <h3 className={css.title}>{t('location')}</h3>
        <p className={css.location}>{plant.location}</p>
      </div>
      <div className={css.botton_container}>
        <div className={css.plant_card_item_status}>
          <h3 className={css.title}>{t('status')}</h3>
          <p
            className={`${css.status} ${plant.status === 'deactivated' ? css.deactivated_status : ''}`}
          >
            {plant.status === 'active' ? (
              <svg width="12" height="12" className={css.check_circle_icon}>
                <use href="/sprite.svg#check-circle"></use>
              </svg>
            ) : (
              <svg width="12" height="12" className={css.delete_icon}>
                <use href="/sprite.svg#delete"></use>
              </svg>
            )}
            {status?.label}
          </p>
        </div>
        <div className={css.plant_card_item}>
          <h3 className={css.title}>{t('actions')}</h3>
          <div className={css.btn_container}>
            <Button
              type="button"
              className={`${css.btn} button button--white`}
              width={38}
              height={32}
              onClick={() => {
                setOpen(true);
              }}
            >
              <svg width="16" height="16" className={css.btn_icon}>
                <use href="/sprite.svg#clipboard"></use>
              </svg>
            </Button>
            <Button
              type="button"
              className={`${css.btn} button button--white`}
              width={38}
              height={32}
              onClick={() => {
                setOpen(true);
              }}
            >
              <svg width="16" height="16" className={css.btn_icon}>
                <use href="/sprite.svg#edit"></use>
              </svg>
            </Button>
            {plant.status === 'active' ? (
              <Button
                type="button"
                className={`${css.btn} button button--white`}
                width={38}
                height={32}
                onClick={() =>
                  handleStatusUpdate({
                    userId: plant._id,
                    status: 'deactivated',
                  })
                }
              >
                <svg width="16" height="16" className={css.btn_icon}>
                  <use href="/sprite.svg#delete"></use>
                </svg>
              </Button>
            ) : (
              <Button
                type="button"
                className={`${css.btn} button button--blue`}
                width={38}
                height={32}
                onClick={() =>
                  handleStatusUpdate({ userId: plant._id, status: 'active' })
                }
              >
                <svg width="16" height="16" className={css.btn_icon_check}>
                  <use href="/sprite.svg#check-circle"></use>
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantCard;
