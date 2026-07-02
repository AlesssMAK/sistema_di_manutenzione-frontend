'use client';

import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import { UploadImages } from '@/components/UI/UploadImages/UploadImages';
import { createFault } from '@/lib/api/faults';
import { generateId } from '@/lib/api/generate';
import { getAllPlants } from '@/lib/api/plants';
import { getAllPartsByPlantId } from '@/lib/api/plantsParts';
import { useAuthStore } from '@/lib/store/authStore';
import { useFaultDraft, initialDraft } from '@/lib/store/reportStore';
import { reportSchema } from '@/lib/validation/reportFormValidation';
import type {
  NewFaultContent,
  ReportFormValues,
  TypeFault,
} from '@/types/faultType';
import { PlantPart } from '@/types/plantPartType';
import { Plant } from '@/types/plantType';
import { yupResolver } from '@hookform/resolvers/yup';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import css from './ReportForm.module.css';
import { useRouter } from 'next/navigation';

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
  const tBtn = useTranslations('btn');
  const locale = useLocale();
  const { user } = useAuthStore();
  const userId = String(user?._id ?? '');
  // Draft is scoped to the logged-in user — falls back to a shared
  // empty draft (stable ref) when none is stored yet.
  const draft = useFaultDraft(s => s.drafts[userId] ?? initialDraft);
  const setDraftForUser = useFaultDraft(s => s.setDraft);
  const clearDraftForUser = useFaultDraft(s => s.clearDraft);
  const setDraft = (next: NewFaultContent) => setDraftForUser(userId, next);
  const clearDraft = () => clearDraftForUser(userId);
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: yupResolver(reportSchema),
    defaultValues: {
      img: [],
      typeFault: draft.typeFault,
      comment: draft.comment,
      plantId: draft.plantId,
      partId: draft.partId,
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
      const plants = await getAllPlants({ perPage: 40 });
      const activePlant = plants.plants.filter(
        item => item.status === 'active'
      );

      setIsPlants(activePlant);
    };
    allPlants();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const time = now.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentTime(time);
    }, 1000);
    return () => clearInterval(interval);
  }, [locale]);

  const selectedPlantId = useWatch({ control, name: 'plantId' });
  const plantOptions = isPlants.map(p => `${p.namePlant} - ${p.code}`);

  useEffect(() => {
    if (!selectedPlantId) return;

    const allPlantParts = async () => {
      const plantParts = await getAllPartsByPlantId({
        plantId: selectedPlantId,
        perPage: 200,
      });
      const activePlantParts = plantParts.plantParts.filter(
        item => item.status === 'active'
      );
      setIsPlantParts(activePlantParts);
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
        typeFault: data.typeFault,
        comment: data.comment,
        img: data.img,
      });

      toast.success(t('reportCreatedSuccessfully'));
      reset();
      clearDraft();
      router.back();
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
            <p className={css.info_text}>{now.toLocaleDateString(locale)}</p>
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
                {...register('typeFault', {
                  onChange: e =>
                    setDraft({
                      ...draft,
                      typeFault: e.target.value as TypeFault,
                    }),
                })}
                checked={draft.typeFault === 'Production'}
              />
              <p className={css.type_text}>{t('production')}</p>
            </label>
            <label className={css.type_label}>
              <input
                type="radio"
                className={css.type_input}
                value="Safety"
                {...register('typeFault', {
                  onChange: e =>
                    setDraft({
                      ...draft,
                      typeFault: e.target.value as TypeFault,
                    }),
                })}
                checked={draft.typeFault === 'Safety'}
              />
              <p className={css.type_text}>{t('safety')}</p>
            </label>
            {errors.typeFault && (
              <p className={css.error}>{errors.typeFault.message}</p>
            )}
          </div>
        </div>

        {/* Note e Descrizione */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('notesDescription')}</h3>
          <label>
            <textarea
              id="comment"
              {...register('comment', {
                onChange: e => setDraft({ ...draft, comment: e.target.value }),
              })}
              required
              className={css.textarea}
              placeholder={t('describeIssue')}
              value={draft.comment}
            />
          </label>
          {errors.comment && (
            <p className={css.error}>{errors.comment.message}</p>
          )}
        </div>

        {/* Immagini */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('images')}</h3>
          <UploadImages
            value={watch('img') ?? []}
            onChange={files => setValue('img', files, { shouldValidate: true })}
          />
          <input type="hidden" {...register('img')} />
          {errors.img && <p className={css.error}>{errors.img.message}</p>}
        </div>
      </div>

      <div className={css.btn_container}>
        <Button
          type="button"
          className="button button--white"
          width="100%"
          onClick={() => {
            clearDraft();
            // Reset RHF too so stale validation errors from a
            // previous submit attempt disappear with the form.
            reset();
            setSelectedPlantLabel('');
            setSelectedPlantPartLabel('');
          }}
        >
          {t('cancel')}
        </Button>
        <Button type="submit" className="button button--blue" width="100%">
          {isSubmitting ? tBtn('loading') : t('sendReport')}
        </Button>
      </div>
    </form>
  );
};

export default ReportForm;
