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
      <div className={css.overlay} onClick={onClose}>
        <div className={css.modal} onClick={e => e.stopPropagation()}>
          <div className={css.header}>
            <h3>Aggiorna Intervento</h3>
            <span className={css.idBadge}>{displayId}</span>
            <button className={css.closeBtn} onClick={onClose} type="button">
              &times;
            </button>
          </div>
          <p className={css.emptyMessage}>
            Nessun aggiornamento possibile da stato &quot;{currentStatus}&quot;.
            {currentStatus === 'Created' &&
              ' Usa "Prendi in carico" per iniziare.'}
          </p>
          <div className={css.actions}>
            <Button className={css.cancelBtn} onClick={onClose}>
              Chiudi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={css.overlay} onClick={onClose}>
      <div className={css.modal} onClick={e => e.stopPropagation()}>
        <div className={css.header}>
          <h3>Aggiorna Intervento</h3>
          <span className={css.idBadge}>{displayId}</span>
          <button className={css.closeBtn} onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
          <div className={css.field}>
            <label className={css.label}>Nuovo stato</label>
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
            <label className={css.label}>Commento manutentore</label>
            <textarea
              {...register('commentMaintenanceWorker')}
              placeholder="Dettagli del lavoro svolto..."
              className={css.textarea}
              rows={3}
            />
          </div>

          {selectedStatus === 'Completed' && (
            <div className={css.field}>
              <label className={css.label}>
                Durata effettiva (minuti) *
              </label>
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
                <label className={css.label}>
                  Motivo della sospensione *
                </label>
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
                <label className={css.label}>
                  Materiale o supporto richiesto
                </label>
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
              className={css.cancelBtn}
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className={css.submitBtn}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Salvataggio...' : 'Conferma e salva'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceUpdateModal;
