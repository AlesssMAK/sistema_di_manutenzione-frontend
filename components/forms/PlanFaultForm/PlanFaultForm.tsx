'use client';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Modal from '@/components/UI/Modal/Modal';
import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import {
  assignFault,
  getMaintenanceWorkers,
  reassignFault,
  type AssignFaultPayload,
} from '@/lib/api/manager';
import {
  planFaultSchema,
  reassignFaultFormSchema,
  type PlanFaultValues,
} from '@/lib/validation/planFaultValidation';
import type {
  AssignedMaintainer,
  FaultCard,
  PriorityFaultType,
  TypeFault,
} from '@/types/faultType';
import css from './PlanFaultForm.module.css';

/**
 * Normalize an assigned-maintainer entry to its ObjectId string.
 * The `Fault` payload may carry either raw ids (legacy/list responses
 * pre-populate) or populated `{ _id, fullName, email }` objects after
 * the manager controller started populating in `f9d9de1`. The form
 * always works with ids — names come from the `getMaintenanceWorkers`
 * query separately.
 */
const toId = (m: AssignedMaintainer): string =>
  typeof m === 'string' ? m : m._id;

interface PlanFaultFormProps {
  fault: FaultCard;
  onClose: () => void;
  /** "plan" (default) shows the full planning form; "reassign" hides
   *  every planning field and only lets the manager swap the
   *  maintainer list — submits to PATCH /manager/fault/:id/reassign. */
  mode?: 'plan' | 'reassign';
}

const PlanFaultForm = ({
  fault,
  onClose,
  mode = 'plan',
}: PlanFaultFormProps) => {
  const isReassign = mode === 'reassign';
  const t = useTranslations('PlanFaultForm');
  const tPriority = useTranslations('Priority');
  const queryClient = useQueryClient();

  const PRIORITY_OPTIONS: { label: string; value: PriorityFaultType }[] = [
    { label: tPriority('Low'), value: 'Low' },
    { label: tPriority('Medium'), value: 'Medium' },
    { label: tPriority('High'), value: 'High' },
  ];

  const [selectedMaintainers, setSelectedMaintainers] = useState<string[]>(
    (fault.assignedMaintainers ?? []).map(toId)
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlanFaultValues>({
    // Both schemas share the same shape; the cast lets us pick at
    // runtime without yup's generic type machinery clashing on the
    // union.
    resolver: yupResolver(
      (isReassign
        ? reassignFaultFormSchema
        : planFaultSchema) as typeof planFaultSchema
    ) as Resolver<PlanFaultValues>,
    mode: 'onSubmit',
    defaultValues: {
      priority: fault.priority ?? 'Medium',
      plannedDate: fault.plannedDate ?? '',
      plannedTime: fault.plannedTime ?? '',
      estimatedDuration: fault.estimatedDuration ?? 60,
      deadline: fault.deadline ?? '',
      managerComment: fault.managerComment ?? '',
      assignedMaintainers: (fault.assignedMaintainers ?? []).map(toId),
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

  const planMutation = useMutation({
    mutationFn: (payload: AssignFaultPayload) => assignFault(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
      queryClient.invalidateQueries({ queryKey: ['fault', fault._id] });
      toast.success(
        fault.plannedDate
          ? t('messages.modifySuccess')
          : t('messages.planSuccess')
      );
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : t('messages.saveError');
      toast.error(message);
    },
  });

  const reassignMutation = useMutation({
    mutationFn: (ids: string[]) => reassignFault(fault._id, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
      queryClient.invalidateQueries({ queryKey: ['fault', fault._id] });
      toast.success(t('messages.modifySuccess'));
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : t('messages.saveError');
      toast.error(message);
    },
  });

  const mutation = isReassign ? reassignMutation : planMutation;

  const onSubmit = (values: PlanFaultValues) => {
    if (isReassign) {
      reassignMutation.mutate(selectedMaintainers);
      return;
    }
    planMutation.mutate({
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
            {isReassign
              ? t('titleReassign')
              : fault.plannedDate
                ? t('titleModify')
                : t('titlePlan')}
          </h1>
          <p className={css.subtitle}>
            {fault.faultId} · {fault.plantId?.namePlant ?? '—'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
          {/* Planning fields hidden in reassign mode — the manager
              only swaps the maintainer list, everything else stays
              as it was. */}
          {!isReassign && (
          <>
          <div className={css.row}>
            <div className={css.field}>
              <p className={css.label}>{t('labels.priority')}</p>
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
              <p className={css.label}>{t('labels.estimatedDuration')}</p>
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
              <p className={css.label}>{t('labels.plannedDate')}</p>
              <Input type="date" {...register('plannedDate')} />
              {errors.plannedDate && (
                <p className={css.error}>{errors.plannedDate.message}</p>
              )}
            </div>

            <div className={css.field}>
              <p className={css.label}>{t('labels.plannedTime')}</p>
              <Input type="time" {...register('plannedTime')} />
              {errors.plannedTime && (
                <p className={css.error}>{errors.plannedTime.message}</p>
              )}
            </div>
          </div>

          <div className={css.field}>
            <p className={css.label}>{t('labels.deadline')}</p>
            <Input type="date" {...register('deadline')} />
            {errors.deadline && (
              <p className={css.error}>{errors.deadline.message}</p>
            )}
          </div>

          <div className={css.field}>
            <p className={css.label}>{t('labels.managerComment')}</p>
            <textarea
              {...register('managerComment')}
              className={css.textarea}
              rows={3}
              placeholder={t('managerCommentPlaceholder')}
            />
            {errors.managerComment && (
              <p className={css.error}>{errors.managerComment.message}</p>
            )}
          </div>
          </>
          )}

          <div className={css.field}>
            <p className={css.label}>{t('labels.assignedMaintainers')}</p>
            {maintainersLoading ? (
              <p className={css.hint}>{t('loadingMaintainers')}</p>
            ) : maintainers.length === 0 ? (
              <p className={css.hint}>{t('noMaintainers')}</p>
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
            {errors.assignedMaintainers && (
              <p className={css.error}>
                {errors.assignedMaintainers.message as string}
              </p>
            )}
            {!isReassign && <p className={css.hint}>{t('poolHint')}</p>}
          </div>

          <div className={css.actions}>
            <Button
              type="button"
              className="button button--white"
              onClick={onClose}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              type="submit"
              className="button button--blue"
              disabled={isSubmitting || mutation.isPending}
            >
              {mutation.isPending ? t('buttons.saving') : t('buttons.save')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PlanFaultForm;
