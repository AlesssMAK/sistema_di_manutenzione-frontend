'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateFaultByWorker } from '@/lib/api/faults';
import {
  ALLOWED_TRANSITIONS,
  maintainerUpdateSchema,
  type MaintainerUpdateValues,
} from '@/lib/validation/maintenanceWorkerUpdateValidation';
import type { FaultCard } from '@/types/faultType';
import Button from '../UI/Button/Button';
import Modal from '../UI/Modal/Modal';
import SelectDropdown from '../UI/SelectDropdown/SelectDropdown';
import css from './MaintenanceUpdateModal.module.css';

interface MaintenanceUpdateModalProps {
  faultId: string;
  displayId: string;
  currentStatus: string;
  onClose: () => void;
  onSuccess: (updatedFault: FaultCard) => void;
}

const STATUS_LABELS: Record<string, string> = {
  'In progress': 'In corso',
  Completed: 'Completato',
  Suspended: 'Sospeso',
};

const MaintenanceUpdateModal = ({
  faultId,
  displayId,
  currentStatus,
  onClose,
  onSuccess,
}: MaintenanceUpdateModalProps) => {
  const queryClient = useQueryClient();
  const availableStatuses = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MaintainerUpdateValues>({
    resolver: yupResolver(
      maintainerUpdateSchema
    ) as Resolver<MaintainerUpdateValues>,
    mode: 'onSubmit',
    defaultValues: {
      statusFault: availableStatuses[0] ?? '',
      commentMaintenanceWorker: '',
      actualDuration: undefined,
      suspensionReason: '',
      materialRequest: '',
    },
  });

  const selectedStatus = watch('statusFault');

  const mutation = useMutation({
    mutationFn: (values: MaintainerUpdateValues) =>
      updateFaultByWorker({
        faultId,
        statusFault: values.statusFault,
        commentMaintenanceWorker: values.commentMaintenanceWorker || undefined,
        ...(values.statusFault === 'Completed' && {
          actualDuration: values.actualDuration as number,
        }),
        ...(values.statusFault === 'Suspended' && {
          suspensionReason: values.suspensionReason,
          materialRequest: values.materialRequest || undefined,
        }),
      }),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
      queryClient.invalidateQueries({ queryKey: ['fault', faultId] });
      toast.success('Intervento aggiornato con successo');
      onSuccess(data);
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : "Errore durante l'aggiornamento";
      toast.error(message);
    },
  });

  const onSubmit = (values: MaintainerUpdateValues) => {
    mutation.mutate(values);
  };

  if (availableStatuses.length === 0) {
    return (
      <Modal onClose={onClose}>
        <div className={css.formContainer}>
          <div className={css.titleContainer}>
            <h1 className={css.title}>Aggiorna intervento</h1>
            <p className={css.subtitle}>{displayId}</p>
          </div>
          <p className={css.emptyMessage}>
            Nessun aggiornamento possibile da stato &quot;{currentStatus}&quot;.
            {currentStatus === 'Created' &&
              ' Usa "Prendi in carico" per iniziare.'}
          </p>
          <div className={css.actions}>
            <Button
              type="button"
              className="button button--white"
              onClick={onClose}
            >
              Chiudi
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className={css.formContainer}>
        <div className={css.titleContainer}>
          <h1 className={css.title}>Aggiorna intervento</h1>
          <p className={css.subtitle}>{displayId}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
          <div className={css.field}>
            <p className={css.label}>Nuovo stato *</p>
            <SelectDropdown
              options={availableStatuses.map(s => STATUS_LABELS[s] ?? s)}
              selectedValue={
                STATUS_LABELS[selectedStatus] ?? selectedStatus
              }
              onSelect={label => {
                const value =
                  availableStatuses.find(s => STATUS_LABELS[s] === label) ??
                  label;
                setValue('statusFault', value, { shouldValidate: false });
              }}
              placeholder="Seleziona stato"
            />
            <input type="hidden" {...register('statusFault')} />
            {errors.statusFault && (
              <p className={css.error}>{errors.statusFault.message}</p>
            )}
          </div>

          <div className={css.field}>
            <p className={css.label}>Commento manutentore</p>
            <textarea
              {...register('commentMaintenanceWorker')}
              placeholder="Dettagli del lavoro svolto..."
              className={css.textarea}
              rows={3}
            />
          </div>

          {selectedStatus === 'Completed' && (
            <div className={css.field}>
              <p className={css.label}>Durata effettiva (minuti) *</p>
              <input
                type="number"
                min={1}
                {...register('actualDuration')}
                className={css.input}
              />
              {errors.actualDuration && (
                <p className={css.error}>{errors.actualDuration.message}</p>
              )}
            </div>
          )}

          {selectedStatus === 'Suspended' && (
            <>
              <div className={css.field}>
                <p className={css.label}>Motivo della sospensione *</p>
                <textarea
                  {...register('suspensionReason')}
                  placeholder="Perché stai sospendendo? (es. attesa di un pezzo, problema di sicurezza...)"
                  className={css.textarea}
                  rows={3}
                />
                {errors.suspensionReason && (
                  <p className={css.error}>
                    {errors.suspensionReason.message}
                  </p>
                )}
              </div>
              <div className={css.field}>
                <p className={css.label}>Materiale o supporto richiesto</p>
                <textarea
                  {...register('materialRequest')}
                  placeholder="Cosa serve per riprendere? (opzionale)"
                  className={css.textarea}
                  rows={2}
                />
              </div>
            </>
          )}

          <div className={css.actions}>
            <Button
              type="button"
              className="button button--white"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className="button button--blue"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Salvataggio...' : 'Conferma e salva'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default MaintenanceUpdateModal;
