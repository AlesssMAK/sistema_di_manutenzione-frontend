'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import Input from '@/components/UI/Input/Input';
import Button from '@/components/UI/Button/Button';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';

import { fetchFaultById } from '@/lib/api/faults';

import type { FaultCard } from '@/types/faultType';

import css from './Maintenance-workerForm.module.css';
import nextServer from '@/lib/api/api';

interface FormValues {
  statusFault: string;
  commentMaintenanceWorker: string;
}

const MaintenanceWorkerForm = () => {
  const t = useTranslations('MaintenanceWorkerForm');
  const { id: faultId } = useParams();
  const router = useRouter();

  const [faultData, setFaultData] = useState<FaultCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      statusFault: 'CREATED',
      commentMaintenanceWorker: '',
    },
  });

  const currentStatus = watch('statusFault');

  
  useEffect(() => {
    const loadFault = async () => {
      try {
        const data = await fetchFaultById(faultId as string);
        setFaultData(data);
        setValue('statusFault', data.statusFault || 'CREATED');
      } catch (error) {
        toast.error('Errore nel caricamento dei dati');
      } finally {
        setIsLoading(false);
      }
    };
    if (faultId) loadFault();
  }, [faultId, setValue]);

  // 2. Отправка данных (PATCH запрос на бэкенд)
  const onSubmit = async (data: FormValues) => {
    try {
      await nextServer.patch('/maintenance-worker/fault', {
        faultId: faultData?._id, // передаем Mongo ID
        statusFault: data.statusFault,
        commentMaintenanceWorker: data.commentMaintenanceWorker,
      });
      toast.success('Intervento aggiornato con successo');
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Errore durante l'invio");
    }
  };

  if (isLoading) return <p>Загрузка...</p>;

  return (
    <div className={css.container}>
      <header className={css.header}>
        <h2 className={css.title}>Dettaglio Intervento</h2>
        <span className={css.faultIdDisplay}>{faultData?.faultId}</span>
      </header>

     
      <div className={css.infoGrid}>
        <div className={css.infoItem}>
          <label>Macchina</label>
          <p>{faultData?.plantId?.namePlant || '---'}</p>
        </div>
        <div className={css.infoItem}>
          <label>Parte di impianto</label>
          <p>{faultData?.partId?.namePlantPart || '---'}</p>
        </div>
        <div className={css.infoItem}>
          <label>Priorità</label>
          <p className={css.priorityTag}>{faultData?.priority}</p>
        </div>
        <div className={css.infoItem}>
          <label>Scadenza</label>
          <p className={css.deadline}>{faultData?.deadline}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
        {/* Выбор статуса (согласно схеме Joi) */}
        <div className={css.field}>
          <label className={css.label}>Stato Intervento</label>
          <SelectDropdown
            options={['CREATED', 'IN_PROGRESS', 'FIXED', 'NOT_FIXED']}
            selectedValue={currentStatus}
            onSelect={val => setValue('statusFault', val)}
            placeholder="Seleziona stato"
            disabled={isSubmitting}
          />
        </div>

        {/* Ваш компонент Input для комментария */}
        <div className={css.field}>
          <label className={css.label}>Note del Manutentore</label>
          <Input
            {...register('commentMaintenanceWorker', {
              required: 'Inserire un commento',
            })}
            placeholder="Descrivi l'intervento effettuato..."
            error={errors.commentMaintenanceWorker?.message}
          />
        </div>

        <div className={css.actions}>
          <Button
            type="submit"
            className="button--blue"
            disabled={isSubmitting}
            width="100%"
          >
            {isSubmitting ? 'Salvataggio...' : 'Finalizza Intervento'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceWorkerForm;
