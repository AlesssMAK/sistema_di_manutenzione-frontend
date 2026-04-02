'use client';

import { useTranslations } from 'next-intl';
import css from './ReportForm.module.css';
import Button from '@/components/UI/Button/Button';
import { useAuthStore } from '@/lib/store/authStore';
import { useEffect, useRef, useState } from 'react';
import { generateId } from '@/lib/api/generate';
import Input from '@/components/UI/Input/Input';
import { getAllPartsByPlantId, getAllPlants } from '@/lib/api/plants';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useWatch } from 'react-hook-form';
import { Plant } from '@/types/plantType';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import { PlantPart } from '@/types/partPlant';
import { reportSchema } from '@/lib/validation/reportFormValidation';
import { ReportFormValues } from '@/types/faultType';
import { createFault } from '@/lib/api/faults';
import toast from 'react-hot-toast';
import { useFaultDraft } from '@/lib/store/reportStore';

const ReportForm = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [generatedId, setGeneratedId] = useState<string>('');
  const [isPlants, setIsPlants] = useState<Plant[]>([]);
  const [isPlantParts, setIsPlantParts] = useState<PlantPart[]>([]);
  const [selectedPlantLabel, setSelectedPlantLabel] = useState<string | null>(
    null
  );
  const [selectedPlantPartLabel, setSelectedPlantPartLabel] = useState<
    string | null
  >(null);

  const t = useTranslations('ReportForm');
  const { user } = useAuthStore();
  const { draft, setDraft, clearDraft } = useFaultDraft();
  const now = new Date();
  const date = now.toISOString().split('T')[0];

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setDraft({
      ...draft,
      [name]: value,
    });
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: yupResolver(reportSchema),
    defaultValues: {
      img: null,
    },
  });

  useEffect(() => {
    const getId = async () => {
      const reportId = await generateId();
      setGeneratedId(reportId);
      setValue('faultId', reportId);
    };
    getId();
  }, []);

  useEffect(() => {
    setValue('dataCreated', date);
  }, [date, setValue]);

  useEffect(() => {
    setValue('timeCreated', currentTime);
  }, [currentTime, setValue]);

  useEffect(() => {
    const allPlants = async () => {
      const plants = await getAllPlants();
      setIsPlants(plants.plants);
    };
    allPlants();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const time = now.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentTime(time);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedPlantId = useWatch({ control, name: 'plantId' });
  const plantOptions = isPlants.map(p => `${p.namePlant} - ${p.code}`);

  useEffect(() => {
    if (!selectedPlantId) return;

    const allPlantParts = async () => {
      const plantParts = await getAllPartsByPlantId(selectedPlantId);

      setIsPlantParts(plantParts.plantParts);
    };

    allPlantParts();
  }, [selectedPlantId]);

  const plantPartOptions = isPlantParts.map(
    p => `${p.namePlantPart} - ${p.codePlantPart}`
  );

  const onReportSubmit = async (data: ReportFormValues) => {
    try {
      await createFault({
        faultId: data.faultId,
        dataCreated: data.dataCreated,
        timeCreated: data.timeCreated,
        plantId: data.plantId,
        partId: data.partId,
        typefault: data.typefault,
        comment: data.comment,
        img: data.img,
      });
      reset();
      toast.success(t('reportCreatedSuccessfully'));
      clearDraft();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!isPlants.length) return;

    if (draft.plantId) {
      setValue('plantId', draft.plantId);

      const plant = isPlants.find(p => p._id === draft.plantId);
      if (plant) {
        setSelectedPlantLabel(`${plant.namePlant} - ${plant.code}`);
      }
    }
  }, [isPlants, draft.plantId, setValue]);

  useEffect(() => {
    if (!isPlantParts.length) return;

    if (draft.partId) {
      setValue('partId', draft.partId);

      const part = isPlantParts.find(p => p._id === draft.partId);
      if (part) {
        setSelectedPlantPartLabel(
          `${part.namePlantPart} - ${part.codePlantPart}`
        );
      }
    }
  }, [isPlantParts, draft.partId, setValue]);

  return (
    <form onSubmit={handleSubmit(onReportSubmit)} className={css.form}>
      <div className={css.report_form_container}>
        <h1 className={css.title}>{t('newReport')}</h1>
        <p className={css.text}>{t('fillForm')}</p>
        <ul className={css.info_list}>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('reportId')}</h3>
            <p className={css.info_text}>{generatedId}</p>
            <Input type="hidden" {...register('faultId')} />
            {errors.faultId && (
              <p className={css.error}>{errors.faultId.message}</p>
            )}
          </li>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('operator')}</h3>
            <p className={css.info_text}>{user?.fullName}</p>
          </li>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('date')}</h3>
            <p className={css.info_text}>{now.toLocaleDateString('it-IT')}</p>
            <Input type="hidden" {...register('dataCreated')} />
            {errors.dataCreated && (
              <p className={css.error}>{errors.dataCreated.message}</p>
            )}
          </li>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('time')}</h3>
            <p className={css.info_text}>{currentTime}</p>
            <Input type="hidden" {...register('timeCreated')} />
            {errors.timeCreated && (
              <p className={css.error}>{errors.timeCreated.message}</p>
            )}
          </li>
        </ul>

        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('plantMachine')}</h3>
          <SelectDropdown
            placeholder={t('selectPlant')}
            options={plantOptions}
            selectedValue={selectedPlantLabel}
            onSelect={label => {
              const plant = isPlants.find(
                p => `${p.namePlant} - ${p.code}` === label
              );

              const id = plant?._id || '';

              setValue('plantId', id);
              setSelectedPlantLabel(label);
              setSelectedPlantPartLabel('');
              setDraft({
                ...draft,
                plantId: id,
                partId: '',
              });
            }}
            disabled={false}
          />
          <Input type="hidden" {...register('plantId')} />
          {errors.plantId && (
            <p className={css.error}>{errors.plantId.message}</p>
          )}
        </div>

        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('plantPart')}</h3>
          <SelectDropdown
            placeholder={t('selectPlantPart')}
            options={plantPartOptions}
            selectedValue={selectedPlantPartLabel}
            onSelect={label => {
              const part = isPlantParts.find(
                p => `${p.namePlantPart} - ${p.codePlantPart}` === label
              );

              const id = part?._id || '';

              setValue('partId', id);
              setSelectedPlantPartLabel(label);
              setDraft({
                ...draft,
                partId: id,
              });
            }}
            disabled={!selectedPlantId || isPlantParts.length === 0}
          />
          <Input
            id="partId"
            type="hidden"
            {...register('partId')}
            value={draft.partId}
            onChange={handleChange}
          />
          {errors.partId && (
            <p className={css.error}>{errors.partId.message}</p>
          )}
        </div>

        {/* type */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('type')}</h3>
          <div className={css.form_item_type}>
            <label className={css.type_label}>
              <input
                type="radio"
                className={css.type_input}
                value="Production"
                {...register('typefault')}
              />
              <p className={css.type_text}>{t('production')}</p>
            </label>
            <label className={css.type_label}>
              <input
                type="radio"
                className={css.type_input}
                value="Safety"
                {...register('typefault')}
              />
              <p className={css.type_text}>{t('safety')}</p>
            </label>
            {errors.typefault && (
              <p className={css.error}>{errors.typefault.message}</p>
            )}
          </div>
        </div>

        {/* Note e Descrizione */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('notesDescription')}</h3>
          <label>
            <textarea
              id="comment"
              {...register('comment')}
              required
              className={css.textarea}
              placeholder={t('describeIssue')}
              value={draft.comment}
              onChange={handleChange}
            />
          </label>
          {errors.comment && (
            <p className={css.error}>{errors.comment.message}</p>
          )}
        </div>

        {/* Immagini */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('images')}</h3>
          <label className={css.upload_label}>
            <Input
              type="file"
              className={css.upload_input}
              accept="image/*"
              {...register('img', {
                onChange: e => {
                  const file = e.target.files?.[0];
                  if (file) setValue('img', file);
                },
              })}
            />
            <div className={css.upload_text_container}>
              <svg width="32" height="32" className={css.upload_icon}>
                <use href="/sprite.svg#load"></use>
              </svg>
              <p className={css.upload_text}>{t('clickToUpload')}</p>
            </div>
          </label>
          {errors.img && <p className={css.error}>{errors.img.message}</p>}
        </div>
      </div>

      <div className={css.btn_container}>
        <Button
          type="button"
          className="button button--white"
          width="100%"
          onClick={() => clearDraft()}
        >
          {t('cancel')}
        </Button>
        <Button type="submit" className="button button--blue" width="100%">
          {isSubmitting ? t('loading') : t('sendReport')}
        </Button>
      </div>
    </form>
  );
};

export default ReportForm;
