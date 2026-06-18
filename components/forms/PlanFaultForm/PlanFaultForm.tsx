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
  addMaintainers,
  assignFault,
  getMaintenanceWorkers,
  reassignFault,
  type AssignFaultPayload,
} from '@/lib/api/manager';
import {
  addMaintainersFormSchema,
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
   *  maintainer list — submits to PATCH /manager/fault/:id/reassign.
   *  "addMaintainers" is append-only: shows already-assigned workers
   *  as readonly chips and lets the manager pick extra ones from the
   *  remaining pool — submits to POST .../add-maintainers. */
  mode?: 'plan' | 'reassign' | 'addMaintainers';
}

const PlanFaultForm = ({
  fault,
  onClose,
  mode = 'plan',
}: PlanFaultFormProps) => {
  const isReassign = mode === 'reassign';
  const isAddMaintainers = mode === 'addMaintainers';
  const planningHidden = isReassign || isAddMaintainers;
  const t = useTranslations('PlanFaultForm');
  const tPriority = useTranslations('Priority');
  const queryClient = useQueryClient();

  const PRIORITY_OPTIONS: { label: string; value: PriorityFaultType }[] = [
    { label: tPriority('Low'), value: 'Low' },
    { label: tPriority('Medium'), value: 'Medium' },
    { label: tPriority('High'), value: 'High' },
  ];

  const existingIds = (fault.assignedMaintainers ?? []).map(toId);
  // In addMaintainers mode the selection is "new picks only" — never
  // pre-fill with existing ids or the BE would reject the payload as
  // duplicates.
  const [selectedMaintainers, setSelectedMaintainers] = useState<string[]>(
    isAddMaintainers ? [] : existingIds
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
      (isAddMaintainers
        ? addMaintainersFormSchema
        : isReassign
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
      assignedMaintainers: isAddMaintainers ? [] : existingIds,
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

  const addMaintainersMutation = useMutation({
    mutationFn: (ids: string[]) => addMaintainers(fault._id, ids),
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

  const mutation = isAddMaintainers
    ? addMaintainersMutation
    : isReassign
      ? reassignMutation
      : planMutation;

  const onSubmit = (values: PlanFaultValues) => {
    if (isAddMaintainers) {
      addMaintainersMutation.mutate(selectedMaintainers);
      return;
    }
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
            {isAddMaintainers
              ? t('titleAddMaintainers')
              : isReassign
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
          {/* Planning fields hidden in reassign/addMaintainers modes —
              the manager only swaps or extends the maintainer list,
              everything else stays as it was. */}
          {!planningHidden && (
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

          {isAddMaintainers && existingIds.length > 0 && (
            <div className={css.field}>
              <p className={css.label}>{t('labels.alreadyAssigned')}</p>
              <ul className={css.existingChips}>
                {(fault.assignedMaintainers ?? []).map((m, i) => {
                  const isObj = typeof m === 'object' && m !== null;
                  const key = isObj ? m._id : String(m);
                  const name = isObj ? m.fullName : '—';
                  return (
                    <li
                      key={key ?? i}
                      className={css.existingChip}
                      title={isObj ? m.email : undefined}
                    >
                      {name}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className={css.field}>
            <p className={css.label}>
              {isAddMaintainers
                ? t('labels.additionalMaintainers')
                : t('labels.assignedMaintainers')}
            </p>
            {maintainersLoading ? (
              <p className={css.hint}>{t('loadingMaintainers')}</p>
            ) : (() => {
                // In addMaintainers mode hide the already-assigned ones —
                // the BE rejects duplicates anyway and the readonly chip
                // row above already shows who is on the fault.
                const visible = isAddMaintainers
                  ? maintainers.filter(w => !existingIds.includes(w._id))
                  : maintainers;
                if (visible.length === 0) {
                  return (
                    <p className={css.hint}>
                      {isAddMaintainers
                        ? t('noMaintainersToAdd')
                        : t('noMaintainers')}
                    </p>
                  );
                }
                return (
                  <ul className={css.maintainersList}>
                    {visible.map(w => {
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
                );
              })()}
            {errors.assignedMaintainers && (
              <p className={css.error}>
                {errors.assignedMaintainers.message as string}
              </p>
            )}
            {!planningHidden && <p className={css.hint}>{t('poolHint')}</p>}
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
