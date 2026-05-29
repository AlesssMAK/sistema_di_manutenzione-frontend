'use client';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '@/components/UI/Modal/Modal';
import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import {
  assignFault,
  getMaintenanceWorkers,
  type AssignFaultPayload,
} from '@/lib/api/manager';
import {
  planFaultSchema,
  type PlanFaultValues,
} from '@/lib/validation/planFaultValidation';
import type {
  FaultCard,
  PriorityFaultType,
  TypeFault,
} from '@/types/faultType';
import css from './PlanFaultForm.module.css';

interface PlanFaultFormProps {
  fault: FaultCard;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { label: string; value: PriorityFaultType }[] = [
  { label: 'Bassa', value: 'Low' },
  { label: 'Media', value: 'Medium' },
  { label: 'Alta', value: 'High' },
];

const PlanFaultForm = ({ fault, onClose }: PlanFaultFormProps) => {
  const queryClient = useQueryClient();

  const [selectedMaintainers, setSelectedMaintainers] = useState<string[]>(
    fault.assignedMaintainers ?? []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlanFaultValues>({
    resolver: yupResolver(planFaultSchema) as Resolver<PlanFaultValues>,
    mode: 'onSubmit',
    defaultValues: {
      priority: fault.priority ?? 'Medium',
      plannedDate: fault.plannedDate ?? '',
      plannedTime: fault.plannedTime ?? '',
      estimatedDuration: fault.estimatedDuration ?? 60,
      deadline: fault.deadline ?? '',
      managerComment: fault.managerComment ?? '',
      assignedMaintainers: fault.assignedMaintainers ?? [],
    },
  });

  const priority = watch('priority');

  const { data: maintainers = [], isLoading: maintainersLoading } = useQuery({
    queryKey: ['users', 'maintenanceWorkers'],
    queryFn: getMaintenanceWorkers,
  });

  useEffect(() => {
    setValue('assignedMaintainers', selectedMaintainers);
  }, [selectedMaintainers, setValue]);

  const toggleMaintainer = (id: string) => {
    setSelectedMaintainers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const mutation = useMutation({
    mutationFn: (payload: AssignFaultPayload) => assignFault(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
      queryClient.invalidateQueries({ queryKey: ['fault', fault._id] });
      toast.success(
        fault.plannedDate
          ? 'Pianificazione aggiornata'
          : 'Segnalazione pianificata'
      );
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Errore durante il salvataggio';
      toast.error(message);
    },
  });

  const onSubmit = (values: PlanFaultValues) => {
    mutation.mutate({
      faultId: fault._id,
      priority: values.priority as PriorityFaultType,
      plannedDate: values.plannedDate,
      plannedTime: values.plannedTime,
      estimatedDuration: Number(values.estimatedDuration),
      deadline: values.deadline,
      managerComment: values.managerComment ?? '',
      assignedMaintainers: selectedMaintainers,
      typeFault: (fault.typeFault ?? 'Production') as TypeFault,
    });
  };

  const priorityLabel =
    PRIORITY_OPTIONS.find(o => o.value === priority)?.label ?? '';

  return (
    <Modal onClose={onClose}>
      <div className={css.formContainer}>
        <div className={css.titleContainer}>
          <h1 className={css.title}>
            {fault.plannedDate
              ? 'Modifica pianificazione'
              : 'Pianifica segnalazione'}
          </h1>
          <p className={css.subtitle}>
            {fault.faultId} · {fault.plantId?.namePlant ?? '—'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
          <div className={css.row}>
            <div className={css.field}>
              <p className={css.label}>Priorità *</p>
              <SelectDropdown
                options={PRIORITY_OPTIONS.map(o => o.label)}
                selectedValue={priorityLabel}
                onSelect={label => {
                  const value = PRIORITY_OPTIONS.find(o => o.label === label)
                    ?.value;
                  if (value) setValue('priority', value);
                }}
              />
              <input type="hidden" {...register('priority')} />
              {errors.priority && (
                <p className={css.error}>{errors.priority.message}</p>
              )}
            </div>

            <div className={css.field}>
              <p className={css.label}>Durata stimata (min) *</p>
              <Input
                type="number"
                min={1}
                {...register('estimatedDuration')}
              />
              {errors.estimatedDuration && (
                <p className={css.error}>{errors.estimatedDuration.message}</p>
              )}
            </div>
          </div>

          <div className={css.row}>
            <div className={css.field}>
              <p className={css.label}>Data pianificata *</p>
              <Input type="date" {...register('plannedDate')} />
              {errors.plannedDate && (
                <p className={css.error}>{errors.plannedDate.message}</p>
              )}
            </div>

            <div className={css.field}>
              <p className={css.label}>Ora pianificata *</p>
              <Input type="time" {...register('plannedTime')} />
              {errors.plannedTime && (
                <p className={css.error}>{errors.plannedTime.message}</p>
              )}
            </div>
          </div>

          <div className={css.field}>
            <p className={css.label}>Scadenza *</p>
            <Input type="date" {...register('deadline')} />
            {errors.deadline && (
              <p className={css.error}>{errors.deadline.message}</p>
            )}
          </div>

          <div className={css.field}>
            <p className={css.label}>Note responsabile</p>
            <textarea
              {...register('managerComment')}
              className={css.textarea}
              rows={3}
              placeholder="Eventuali note per il manutentore..."
            />
            {errors.managerComment && (
              <p className={css.error}>{errors.managerComment.message}</p>
            )}
          </div>

          <div className={css.field}>
            <p className={css.label}>Manutentori assegnati</p>
            {maintainersLoading ? (
              <p className={css.hint}>Caricamento...</p>
            ) : maintainers.length === 0 ? (
              <p className={css.hint}>Nessun manutentore disponibile</p>
            ) : (
              <ul className={css.maintainersList}>
                {maintainers.map(w => {
                  const checked = selectedMaintainers.includes(w._id);
                  return (
                    <li key={w._id} className={css.maintainerItem}>
                      <label className={css.maintainerLabel}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMaintainer(w._id)}
                        />
                        <span>{w.fullName}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className={css.hint}>
              Lascia vuoto per mettere la segnalazione nel pool (qualsiasi
              manutentore potrà prenderla)
            </p>
          </div>

          <div className={css.actions}>
            <Button
              type="button"
              className="button button--white"
              onClick={onClose}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className="button button--blue"
              disabled={isSubmitting || mutation.isPending}
            >
              {mutation.isPending ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PlanFaultForm;
