'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { formatDuration, roundToStep } from '@/lib/utils/faultTime';
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
import {
  updateFaultByWorker,
  getAlreadyWorkingFault,
  type ActiveWorkFault,
} from '@/lib/api/faults';
import {
  ALLOWED_TRANSITIONS,
  maintainerUpdateSchema,
  type MaintainerUpdateValues,
} from '@/lib/validation/maintenanceWorkerUpdateValidation';
import type { FaultCard } from '@/types/faultType';
import FaultIdBadge from '@/components/UI/FaultIdBadge/FaultIdBadge';
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
  /** Floor for the actual duration: the time already booked before this
   *  completion (up to the last suspension). The stated value can't go
   *  below it. */
  minDuration?: number;
  onClose: () => void;
  onSuccess: (updatedFault: FaultCard) => void;
  /** Called instead of the generic error toast when the update is a resume
   *  (→ In progress) blocked because the technician is already working on
   *  another fault. Lets the parent surface the "già al lavoro" modal. */
  onBlockedByActiveWork?: (active: ActiveWorkFault) => void;
}

// Pull the backend's human message out of an axios error (the Next proxy
// wraps it as { error: { message } }); falls back to a generic string.
const errorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: unknown } }).response?.data as
      | { error?: { message?: string } | string; message?: string }
      | undefined;
    const msg =
      (typeof data?.error === 'object' ? data?.error?.message : undefined) ??
      (typeof data?.error === 'string' ? data.error : undefined) ??
      data?.message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return fallback;
};

const MaintenanceUpdateModal = ({
  faultId,
  displayId,
  currentStatus,
  lockedStatus,
  defaultActualDuration,
  minDuration = 0,
  onClose,
  onSuccess,
  onBlockedByActiveWork,
}: MaintenanceUpdateModalProps) => {
  const t = useTranslations('MaintenanceUpdateModal');
  const tDur = useTranslations('Duration');
  const queryClient = useQueryClient();
  const { moduleEnabled } = useWarehouseAccess();
  // Structured materials to issue from stock on completion (optional).
  const [materials, setMaterials] = useState<MaterialsPayload | null>(null);
  // Submit-blocking error shown inline in the modal (e.g. out-of-stock).
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    setError,
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

  // The materials picker shows on both Completed and Suspended. Reset the
  // picked materials when the status changes so a selection made under one
  // status doesn't linger (and get issued) under the other.
  const [prevStatus, setPrevStatus] = useState(selectedStatus);
  if (prevStatus !== selectedStatus) {
    setPrevStatus(selectedStatus);
    setMaterials(null);
  }

  const mutation = useMutation({
    mutationFn: async (values: MaintainerUpdateValues) => {
      // Issue the picked materials FIRST, in strict mode: if any item is
      // out of stock this rejects (writing nothing) and the fault is never
      // updated — a fault can't be closed against stock that isn't there.
      if (materials) {
        await stockOut({
          warehouseId: materials.warehouseId,
          lines: materials.lines,
          reference: { type: 'fault', faultId },
          strict: true,
        });
        queryClient.invalidateQueries({ queryKey: ['warehouse', 'stock'] });
        queryClient.invalidateQueries({ queryKey: ['warehouse', 'movements'] });
      }

      return updateFaultByWorker({
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
      });
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['faults'] });
      queryClient.invalidateQueries({ queryKey: ['fault', faultId] });
      toast.success(t('messages.success'));
      onSuccess(data);
      onClose();
    },
    onError: (err: unknown) => {
      // Resuming while another fault is running → let the parent open the
      // "già al lavoro" modal instead of a dead-end error toast.
      const active = getAlreadyWorkingFault(err);
      if (active && onBlockedByActiveWork) {
        onBlockedByActiveWork(active);
        onClose();
        return;
      }
      const message = errorMessage(err, t('messages.error'));
      setSubmitError(message);
      toast.error(message);
    },
  });

  const onSubmit = (values: MaintainerUpdateValues) => {
    setSubmitError(null);
    if (values.statusFault === 'Completed') {
      let d = Number(values.actualDuration ?? 0);
      // Can't state less than what was already worked (up to the last pause).
      if (d > 0 && d < minDuration) {
        setError('actualDuration', {
          type: 'min',
          message: t('errors.durationBelowFloor', {
            min: formatDuration(minDuration, {
              d: tDur('d'),
              h: tDur('h'),
              m: tDur('m'),
            }),
          }),
        });
        return;
      }
      // Left at zero → sensible default (never below the floor).
      if (d <= 0) d = Math.max(15, minDuration);
      mutation.mutate({ ...values, actualDuration: d });
      return;
    }
    mutation.mutate(values);
  };

  if (availableStatuses.length === 0) {
    return (
      <Modal onClose={onClose}>
        <div className={css.formContainer}>
          <div className={css.titleContainer}>
            <h1 className={css.title}>{modalTitle}</h1>
            <p className={css.subtitle}>
            <FaultIdBadge id={displayId} />
          </p>
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
          <p className={css.subtitle}>
            <FaultIdBadge id={displayId} />
          </p>
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

          {selectedStatus === 'Completed' && moduleEnabled && (
            <div className={css.field}>
              <p className={css.label}>{t('labels.stockMaterials')}</p>
              <FaultMaterialsPicker onChange={setMaterials} />
            </div>
          )}

          {/* Free-text note sits below the stock materials picker. */}
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
              {moduleEnabled && (
                <div className={css.field}>
                  <p className={css.label}>{t('labels.stockMaterials')}</p>
                  <FaultMaterialsPicker onChange={setMaterials} />
                </div>
              )}
              {/* Free-text request sits below the stock materials picker. */}
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

          {submitError && (
            <p className={css.submitError} role="alert">
              {submitError}
            </p>
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
