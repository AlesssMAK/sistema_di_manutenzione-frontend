'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { roundToStep } from '@/lib/utils/faultTime';
import { useWarehouseAccess } from '@/lib/hooks/useWarehouseAccess';
import { stockOut } from '@/lib/api/warehouse';
import FaultMaterialsPicker, {
  type MaterialsPayload,
} from '@/components/Warehouse/FaultMaterialsPicker/FaultMaterialsPicker';
import DurationPicker from '@/components/UI/DurationPicker/DurationPicker';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { updateFaultByWorker } from '@/lib/api/faults';
import {
  ALLOWED_TRANSITIONS,
  maintainerUpdateSchema,
  type MaintainerUpdateValues,
} from '@/lib/validation/maintenanceWorkerUpdateValidation';
import type { FaultCard } from '@/types/faultType';
import css from './MaintenanceUpdateModal.module.css';
import Button from '@/components/UI/Button/Button';
import Modal from '@/components/UI/Modal/Modal';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';

interface MaintenanceUpdateModalProps {
  faultId: string;
  displayId: string;
  currentStatus: string;
  /** When set, the modal targets exactly this status: the status
   *  dropdown is hidden and only that transition's fields are shown.
   *  Driven by the dedicated Finalizza / Sospendi / Riprendi buttons
   *  on the detail page. */
  lockedStatus?: string;
  /** Auto-computed worked minutes used to prefill the (editable)
   *  "actual duration" field on completion. */
  defaultActualDuration?: number;
  onClose: () => void;
  onSuccess: (updatedFault: FaultCard) => void;
}

const MaintenanceUpdateModal = ({
  faultId,
  displayId,
  currentStatus,
  lockedStatus,
  defaultActualDuration,
  onClose,
  onSuccess,
}: MaintenanceUpdateModalProps) => {
  const t = useTranslations('MaintenanceUpdateModal');
  const queryClient = useQueryClient();
  const { canOperate: canOperateWarehouse, moduleEnabled } =
    useWarehouseAccess();
  // Structured materials to issue from stock on completion (optional).
  const [materials, setMaterials] = useState<MaterialsPayload | null>(null);
  const isLocked = Boolean(lockedStatus);
  const availableStatuses = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  const STATUS_LABELS: Record<string, string> = {
    'In progress': t('statusOptions.inProgress'),
    Completed: t('statusOptions.completed'),
    Suspended: t('statusOptions.suspended'),
  };

  // Per-action title when a status is locked; falls back to the generic
  // title for the (unlocked) dropdown flow.
  const LOCKED_TITLES: Record<string, string> = {
    Completed: t('titles.complete'),
    Suspended: t('titles.suspend'),
    'In progress': t('titles.resume'),
  };
  const modalTitle =
    isLocked && lockedStatus
      ? (LOCKED_TITLES[lockedStatus] ?? t('title'))
      : t('title');

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
      statusFault: lockedStatus ?? availableStatuses[0] ?? '',
      commentMaintenanceWorker: '',
      // Prefilled with the auto-computed worked time (slot-aligned);
      // still editable via the duration picker.
      actualDuration:
        defaultActualDuration != null
          ? roundToStep(defaultActualDuration)
          : undefined,
      suspensionReason: '',
      materialRequest: '',
    },
  });

  const selectedStatus = watch('statusFault');
  const actualDuration = Number(watch('actualDuration') ?? 0);

  const mutation = useMutation({
    mutationFn: (values: MaintainerUpdateValues) =>
      updateFaultByWorker({
        faultId,
        statusFault: values.statusFault,
        // For Suspended the suspensionReason field below already
        // captures the worker's comment — sending a separate
        // commentMaintenanceWorker would just duplicate it.
        ...(values.statusFault !== 'Suspended' && {
          commentMaintenanceWorker:
            values.commentMaintenanceWorker || undefined,
        }),
        ...(values.statusFault === 'Completed' && {
          actualDuration: values.actualDuration as number,
          materialRequest: values.materialRequest || undefined,
        }),
        ...(values.statusFault === 'Suspended' && {
          suspensionReason: values.suspensionReason,
          materialRequest: values.materialRequest || undefined,
        }),
      }),
    onSuccess: async data => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
      queryClient.invalidateQueries({ queryKey: ['fault', faultId] });
      // Best-effort: issue the picked materials against this fault. The
      // fault is already updated, so a stock failure only warns.
      if (materials) {
        try {
          await stockOut({
            warehouseId: materials.warehouseId,
            lines: materials.lines,
            reference: { type: 'fault', faultId },
          });
          queryClient.invalidateQueries({ queryKey: ['warehouse', 'stock'] });
          queryClient.invalidateQueries({
            queryKey: ['warehouse', 'movements'],
          });
        } catch {
          toast.error(t('messages.materialsError'));
        }
      }
      toast.success(t('messages.success'));
      onSuccess(data);
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : t('messages.error');
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
            <h1 className={css.title}>{modalTitle}</h1>
            <p className={css.subtitle}>{displayId}</p>
          </div>
          <p className={css.emptyMessage}>
            {t('messages.noTransitions', { status: currentStatus })}
            {currentStatus === 'Created' && t('messages.takeOverHint')}
          </p>
          <div className={css.actions}>
            <Button
              type="button"
              className="button button--white"
              onClick={onClose}
            >
              {t('buttons.close')}
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
          <h1 className={css.title}>{modalTitle}</h1>
          <p className={css.subtitle}>{displayId}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
          {/* Status is fixed when the modal is opened from a dedicated
              action button; only the dropdown flow needs the picker. */}
          {!isLocked && (
            <div className={css.field}>
              <p className={css.label}>{t('labels.newStatus')}</p>
              <SelectDropdown
                options={availableStatuses.map(s => STATUS_LABELS[s] ?? s)}
                selectedValue={STATUS_LABELS[selectedStatus] ?? selectedStatus}
                onSelect={label => {
                  const value =
                    availableStatuses.find(s => STATUS_LABELS[s] === label) ??
                    label;
                  setValue('statusFault', value, { shouldValidate: false });
                }}
                placeholder={t('placeholders.statusSelect')}
              />
              {errors.statusFault && (
                <p className={css.error}>{errors.statusFault.message}</p>
              )}
            </div>
          )}
          {/* statusFault is always registered (hidden) so the locked
              value is submitted even without the dropdown above. */}
          <input type="hidden" {...register('statusFault')} />

          {/* Hide the generic maintainer comment when suspending —
              the suspensionReason field below captures the same
              intent and was previously a confusing duplicate. */}
          {selectedStatus !== 'Suspended' && (
            <div className={css.field}>
              <p className={css.label}>{t('labels.maintainerComment')}</p>
              <textarea
                {...register('commentMaintenanceWorker')}
                placeholder={t('placeholders.maintainerComment')}
                className={css.textarea}
                rows={3}
              />
            </div>
          )}

          {selectedStatus === 'Completed' && (
            <div className={css.field}>
              <p className={css.label}>{t('labels.actualDuration')}</p>
              <DurationPicker
                valueMinutes={actualDuration}
                onChange={v =>
                  setValue('actualDuration', v, { shouldValidate: false })
                }
              />
              <input type="hidden" {...register('actualDuration')} />
              {errors.actualDuration && (
                <p className={css.error}>{errors.actualDuration.message}</p>
              )}
            </div>
          )}

          {selectedStatus === 'Completed' && (
            <div className={css.field}>
              <p className={css.label}>{t('labels.materialUsed')}</p>
              <textarea
                {...register('materialRequest')}
                placeholder={t('placeholders.materialUsed')}
                className={css.textarea}
                rows={2}
              />
            </div>
          )}

          {selectedStatus === 'Completed' &&
            moduleEnabled &&
            canOperateWarehouse && (
              <div className={css.field}>
                <p className={css.label}>{t('labels.stockMaterials')}</p>
                <FaultMaterialsPicker onChange={setMaterials} />
              </div>
            )}

          {selectedStatus === 'Suspended' && (
            <>
              <div className={css.field}>
                <p className={css.label}>{t('labels.suspensionReason')}</p>
                <textarea
                  {...register('suspensionReason')}
                  placeholder={t('placeholders.suspensionReason')}
                  className={css.textarea}
                  rows={3}
                />
                {errors.suspensionReason && (
                  <p className={css.error}>{errors.suspensionReason.message}</p>
                )}
              </div>
              <div className={css.field}>
                <p className={css.label}>{t('labels.materialRequest')}</p>
                <textarea
                  {...register('materialRequest')}
                  placeholder={t('placeholders.materialRequest')}
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
              {t('buttons.cancel')}
            </Button>
            <Button
              type="submit"
              className="button button--blue"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t('buttons.submitting') : t('buttons.submit')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default MaintenanceUpdateModal;
