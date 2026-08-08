import Button from '@/components/UI/Button/Button';
import css from '../CreateAndUpdateUserForm/CreateAndEditUserForm.module.css';
import css_form from './CreateAndEditPlantAndPlantPartsForm.module.css';
import { useTranslations } from 'next-intl';
import Modal from '@/components/UI/Modal/Modal';
import { useQueryClient } from '@tanstack/react-query';
import {
  Resolver,
  useForm,
  UseFormRegister,
  FieldValues,
} from 'react-hook-form';
import { CreatePlantPart, UpdatePlantPart } from '@/types/plantPartType';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  createPlantPartSchema,
  updatePlantPartSchema,
} from '@/lib/validation/createAndUpdatePlantAndPalntPartsFormValidation';
import { useEffect } from 'react';
import { STATUS } from '@/constants/status';
import Input from '@/components/UI/Input/Input';
import toast from 'react-hot-toast';
import axios from 'axios';
import { createPlantParts, updatePlantParts } from '@/lib/api/plantsParts';

interface CreateAndEditPlantPartsFormProps {
  plantId: string;
  onClose: () => void;
  initialDataForPlantPart?: initialDataForPlantPart;
  isPlantPartsEditMode?: boolean;
}

interface initialDataForPlantPart {
  plantId: string;
  plantPartId: string;
  namePlantPart: string;
  codePlantPart: string;
  status: string;
}

const CreateAndEditPlantPartsForm = ({
  plantId,
  onClose,
  initialDataForPlantPart,
  isPlantPartsEditMode,
}: CreateAndEditPlantPartsFormProps) => {
  const t = useTranslations('AdminPage.CreateAndEditPlantAndPlantPartsForm');
  const tStatus = useTranslations('Statuses');

  const queryClient = useQueryClient();

  const createPlantPartForm = useForm<CreatePlantPart>({
    resolver: yupResolver(createPlantPartSchema) as Resolver<CreatePlantPart>,
    mode: 'onSubmit',
  });

  const updatePlantPartForm = useForm<UpdatePlantPart>({
    resolver: yupResolver(updatePlantPartSchema) as Resolver<UpdatePlantPart>,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (isPlantPartsEditMode && initialDataForPlantPart) {
      updatePlantPartForm.reset({
        namePlantPart: initialDataForPlantPart.namePlantPart,
        codePlantPart: initialDataForPlantPart.codePlantPart,
        status: initialDataForPlantPart.status as STATUS,
      });
    }
  }, [
    initialDataForPlantPart,
    isPlantPartsEditMode,
    updatePlantPartForm.reset,
    updatePlantPartForm,
  ]);

  const statusPlantPart = updatePlantPartForm.watch('status');
  const isActivePlantPart = statusPlantPart === 'active';

  const onCreatePlantPartSubmit = async (data: CreatePlantPart) => {
    try {
      await createPlantParts({
        plantId: plantId,
        parts: [
          {
            namePlantPart: data.namePlantPart,
            codePlantPart: data.codePlantPart,
          },
        ],
      });

      toast.success(t('messages.partCreated'));
      createPlantPartForm.reset();
      onClose();

      queryClient.invalidateQueries({ queryKey: ['plantParts'] });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message =
          error.response?.data?.message ??
          error.response?.data?.error?.message ??
          t('errors.unknownError');

        if (status === 409) {
          const lower = message.toLowerCase();

          if (lower.includes('plant parts')) {
            createPlantPartForm.setError('codePlantPart', {
              type: 'server',
              message: t('errors.partCodeExists'),
            });
            toast.error(t('errors.partCodeExists'));
          } else {
            toast.error(message);
          }
          return;
        }

        toast.error(message);
        return;
      }
    }
  };

  const plantIdForPart = initialDataForPlantPart?.plantId || '';
  const plantPartId = initialDataForPlantPart?.plantPartId || '';

  const onUpdatePlantPartSubmit = async (data: UpdatePlantPart) => {
    try {
      await updatePlantParts({
        plantIdForPart,
        plantPartId,
        data: {
          namePlantPart: data.namePlantPart,
          codePlantPart: data.codePlantPart,
          status: data.status,
        },
      });

      toast.success(t('messages.partUpdated'));
      updatePlantPartForm.reset();
      onClose();

      queryClient.invalidateQueries({ queryKey: ['plantParts'] });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message =
          error.response?.data?.message ??
          error.response?.data?.error?.message ??
          t('errors.unknownError');

        if (status === 409) {
          updatePlantPartForm.setError('codePlantPart', {
            type: 'server',
            message: t('errors.partCodeExists'),
          });
          toast.error(t('errors.partCodeExists'));
        } else {
          toast.error(message);
        }
        return;
      }
    }
  };

  const register = isPlantPartsEditMode
    ? (updatePlantPartForm.register as unknown as UseFormRegister<FieldValues>)
    : (createPlantPartForm.register as unknown as UseFormRegister<FieldValues>);

  const activeForm = isPlantPartsEditMode
    ? updatePlantPartForm
    : createPlantPartForm;

  return (
    <Modal onClose={onClose}>
      <div className={css.title_container}>
        <h1 className="title">
          {isPlantPartsEditMode ? t('partTitleEdit') : t('partTitleNew')}
        </h1>
        <p className="subtitle">{t('partSubtitle')}</p>
      </div>
      <div>
        <form
          onSubmit={
            isPlantPartsEditMode
              ? updatePlantPartForm.handleSubmit(onUpdatePlantPartSubmit)
              : createPlantPartForm.handleSubmit(onCreatePlantPartSubmit)
          }
        >
          <div className={css_form.plant_part_form_container}>
            <div className={css_form.plant_part_inputs_container}>
              <div className={css.form_item_container}>
                <p className={css.form_label}>
                  {t('labels.namePlantPart')}
                  {isPlantPartsEditMode ? '' : ' *'}
                </p>
                <Input
                  {...register('namePlantPart')}
                  type="text"
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    background: '#f3f3f5',
                    border: 'none',
                  }}
                />
                {activeForm.formState.errors.namePlantPart && (
                  <p className={css.error}>
                    {activeForm.formState.errors.namePlantPart.message}
                  </p>
                )}
              </div>
              <div className={css.form_item_container}>
                <p className={css.form_label}>
                  {t('labels.code')}
                  {isPlantPartsEditMode ? '' : ' *'}
                </p>
                <Input
                  {...register('codePlantPart')}
                  type="text"
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    background: '#f3f3f5',
                    border: 'none',
                  }}
                />
                {activeForm.formState.errors.codePlantPart && (
                  <p className={css.error}>
                    {activeForm.formState.errors.codePlantPart.message}
                  </p>
                )}
              </div>
            </div>
            {isActivePlantPart && (
              <div className={css.form_item_container}>
                <p className={css.form_label}>{t('labels.status')}</p>
                <div className={css.label_container}>
                  <input
                    onChange={e =>
                      updatePlantPartForm.setValue(
                        'status',
                        e.target.checked ? 'active' : 'deactivated',
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      )
                    }
                    type="checkbox"
                    className={css.status_input}
                    checked={isActivePlantPart}
                    id="plant-part-status"
                  />
                  <label
                    htmlFor="plant-part-status"
                    className={css.status_label}
                  />
                  <p className={css.status_label_text}>
                    {isActivePlantPart
                      ? tStatus('active')
                      : tStatus('deactivated')}
                  </p>
                </div>
                {updatePlantPartForm.formState.errors.status && (
                  <p className={css.error}>
                    {updatePlantPartForm.formState.errors.status.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className={css.btn_form_container}>
            <Button
              type="button"
              className="button button--white"
              width="100%"
              onClick={() => {
                onClose();
              }}
            >
              {t('buttons.cancel')}
            </Button>
            <Button type="submit" className="button button--blue" width="100%">
              {isPlantPartsEditMode
                ? t('buttons.saveChanges')
                : t('buttons.createPart')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateAndEditPlantPartsForm;
