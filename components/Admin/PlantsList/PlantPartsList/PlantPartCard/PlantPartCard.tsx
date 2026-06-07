import Button from '@/components/UI/Button/Button';
import css from './PlantPartCard.module.css';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import CreateAndEditPlantAndPlantPartsForm from '@/components/forms/CreateAndEditPlantAndPlantPartsForm/CreateAndEditPlantAndPlantPartsForm';
import { updatePlantParts } from '@/lib/api/plantsParts';
import { PlantPart, UpdatePlantPartRequest } from '@/types/plantPartType';
import { getStatusOptions, STATUS } from '@/constants/status';

interface PlantPartCardProps {
  plantId: string;
  plantPart: PlantPart;
}

interface UpdateStatus {
  plantId: string;
  plantPartId: string;
  status: STATUS;
}

const PlantPartCard = ({ plantPart, plantId }: PlantPartCardProps) => {
  const [openUpdatePlantPartModal, setOpenUpdatePlantPartModal] =
    useState(false);
  const t = useTranslations('AdminPage.PlantsList');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ plantId, plantPartId, data }: UpdatePlantPartRequest) =>
      updatePlantParts({ plantId, plantPartId, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantParts'] });
    },
  });

  const statuses = getStatusOptions();
  const status = statuses.find(status => status.value === plantPart.status);

  const handleStatusUpdate = async ({
    plantId,
    plantPartId,
    status,
  }: UpdateStatus) => {
    mutation.mutate({ plantId, plantPartId, data: { status } });
  };

  const deletePlantPart = async () => {
    console.log();
  };

  return (
    <div>
      <div className={css.plant_part_card_container}>
        <div className={css.head_container}>
          <div className={css.plant_part_card_item_name}>
            <h3 className={css.title}>{t('namePlantPart')}</h3>
            <p className={css.name}>{plantPart.namePlantPart}</p>
          </div>
          <div className={css.plant_part_card_item_code}>
            <h3 className={css.title}>{t('code')}</h3>
            <p className={css.code}>{plantPart.codePlantPart}</p>
          </div>
        </div>
        <div className={css.botton_container}>
          <div className={css.plant_part_card_item_status}>
            <h3 className={css.title}>{t('status')}</h3>
            <p
              className={`${css.status} ${plantPart.status === 'deactivated' ? css.deactivated_status : ''}`}
            >
              {plantPart.status === 'active' ? (
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
          <div className={css.plant_part_card_item}>
            <h3 className={css.title}>{t('actions')}</h3>
            <div className={css.btn_container}>
              <Button
                type="button"
                className={`${css.btn} button button--white`}
                width={38}
                height={32}
                onClick={() => {
                  setOpenUpdatePlantPartModal(true);
                }}
              >
                <svg width="16" height="16" className={css.btn_icon}>
                  <use href="/sprite.svg#edit"></use>
                </svg>
              </Button>
              {plantPart.status === 'active' ? (
                <Button
                  type="button"
                  className={`${css.btn} button button--white`}
                  width={38}
                  height={32}
                  onClick={() =>
                    handleStatusUpdate({
                      plantId: plantId,
                      plantPartId: plantPart._id,
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
                    handleStatusUpdate({
                      plantId: plantId,
                      plantPartId: plantPart._id,
                      status: 'active',
                    })
                  }
                >
                  <svg width="16" height="16" className={css.btn_icon_check}>
                    <use href="/sprite.svg#check-circle"></use>
                  </svg>
                </Button>
              )}
              <Button
                type="button"
                className={`${css.btn} ${css.btn_delete} button button--blue`}
                width={38}
                height={32}
                onClick={() => {
                  deletePlantPart();
                }}
              >
                <svg width="16" height="16" className={css.btn_icon_delete}>
                  <use href="/sprite.svg#delete"></use>
                </svg>
              </Button>
            </div>
          </div>
        </div>
        {openUpdatePlantPartModal && (
          <CreateAndEditPlantAndPlantPartsForm
            onClose={() => setOpenUpdatePlantPartModal(false)}
            isPlantPartsEditMode={true}
            // initialData={InitialData}
          />
        )}
      </div>
    </div>
  );
};

export default PlantPartCard;
