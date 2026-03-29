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
  const [isSelectedPlantPartId, setIsSelectedPlantPartId] = useState<
    string | null
  >(null);

  const t = useTranslations('ReportForm');
  const { user } = useAuthStore();
  const now = new Date();
  const date = now.toLocaleDateString('it-IT');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    // resolver: yupResolver(),
  });

  useEffect(() => {
    const getId = async () => {
      const reportId = await generateId();
      setGeneratedId(reportId);
    };
    getId();
  }, []);

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

  const selectedPlantId = useWatch({ control, name: 'plant' });
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
  const selectedPlantPartId = useWatch({ control, name: 'plantPart' });

  return (
    <form className={css.form}>
      <div className={css.report_form_container}>
        <ul className={css.info_list}>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('reportId')}</h3>
            <p className={css.info_text}>{generatedId}</p>
            <Input type="hidden" name="generatedId" value={generatedId} />
          </li>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('operator')}</h3>
            <p className={css.info_text}>{user?.fullName}</p>
          </li>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('date')}</h3>
            <p className={css.info_text}>{date}</p>
            <Input type="hidden" name="generatedId" value={date} />
          </li>
          <li className={css.info_list_item}>
            <h3 className={css.info_title}>{t('time')}</h3>
            <p className={css.info_text}>{currentTime}</p>
            <Input type="hidden" name="generatedId" value={currentTime} />
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

              setValue('plant', plant?._id);
              setSelectedPlantLabel(label);
              setSelectedPlantPartLabel('');
            }}
            disabled={false}
          />
          <Input type="hidden" name="plant" value={selectedPlantId || ''} />
        </div>

        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('plantPart')}</h3>
          <SelectDropdown
            placeholder={t('selectPlantPart')}
            options={plantPartOptions}
            selectedValue={selectedPlantPartLabel}
            onSelect={label => {
              const plant = isPlantParts.find(
                p => `${p.namePlantPart} - ${p.codePlantPart}` === label
              );

              setValue('plantPart', plant?._id);
              setSelectedPlantPartLabel(label);
            }}
            disabled={!selectedPlantId}
          />
          <Input
            type="hidden"
            name="plantPart"
            value={selectedPlantPartId || ''}
          />
        </div>

        {/* type */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('type')}</h3>
          <div className={css.form_item_type}>
            <label className={css.type_label}>
              <Input
                type="radio"
                name="status"
                className={css.type_input}
                value="produzione"
              />
              <p className={css.type_text}>{t('production')}</p>
            </label>
            <label className={css.type_label}>
              <Input
                type="radio"
                name="status"
                className={css.type_input}
                value="sicurezza"
              />
              <p className={css.type_text}>{t('safety')}</p>
            </label>
          </div>
        </div>

        {/* Note e Descrizione */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('notesDescription')}</h3>
          <label>
            <textarea
              name="name"
              required
              className={css.textarea}
              placeholder={t('describeIssue')}
            />
          </label>
        </div>
        {/* Immagini */}

        <div className={css.form_item}>
          <h3 className={css.form_title}>{t('images')}</h3>
          <label className={css.upload_label}>
            <Input type="file" className={css.upload_input} accept="image/*" />
            <div className={css.upload_text_container}>
              <svg width="32" height="32" className={css.upload_icon}>
                <use href="/sprite.svg#load"></use>
              </svg>
              <p className={css.upload_text}>{t('clickToUpload')}</p>
            </div>
          </label>
        </div>
      </div>
      <div className={css.btn_container}>
        <Button type="button" className="button button--white" width="100%">
          {t('cancel')}
        </Button>
        <Button type="submit" className="button button--blue" width="100%">
          {t('sendReport')}
        </Button>
      </div>
    </form>
  );
};

export default ReportForm;
