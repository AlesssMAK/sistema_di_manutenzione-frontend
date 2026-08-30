'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Modal from '@/components/UI/Modal/Modal';
import Button from '@/components/UI/Button/Button';
import FaultIdBadge from '@/components/UI/FaultIdBadge/FaultIdBadge';
import MaintenanceUpdateModal from '@/components/MaintenanceWorker/MaintenanceUpdateModal/MaintenanceUpdateModal';
import type { ActiveWorkFault } from '@/lib/api/faults';
import css from './AlreadyWorkingModal.module.css';

interface AlreadyWorkingModalProps {
  /** The fault the technician is already actively working on. */
  active: ActiveWorkFault;
  /** Called once the active fault has been finalized / suspended, so the
   *  caller can auto-start the fault the technician originally wanted. */
  onResolved: () => void;
  /** Dismiss without acting (keep working on the active fault). */
  onClose: () => void;
}

/**
 * Shown when a technician tries to start a second fault while one is still
 * running (backend 409 ALREADY_WORKING). Offers three ways out, all acting
 * on the CURRENT fault: finalize it, suspend it (both then auto-start the
 * intended one via onResolved), or continue — jump to the active fault.
 */
const AlreadyWorkingModal = ({
  active,
  onResolved,
  onClose,
}: AlreadyWorkingModalProps) => {
  const t = useTranslations('AlreadyWorkingModal');
  const router = useRouter();
  // 'prompt' shows the choice; the status values reuse the update modal to
  // finalize / suspend the active fault.
  const [mode, setMode] = useState<'prompt' | 'Completed' | 'Suspended'>(
    'prompt'
  );

  const plantName = active.plantId?.namePlant;

  // Prefill the finalize duration with the fault's real worked time (booked
  // spans + the currently-running one) so the picker isn't a blank 15 min,
  // and floor it at the already-booked minutes (the backend enforces this).
  const bookedMinutes = Math.round((active.workedMs ?? 0) / 60000);
  const workedMinutes = Math.round(
    ((active.workedMs ?? 0) +
      (active.workStartedAt
        ? Math.max(0, Date.now() - new Date(active.workStartedAt).getTime())
        : 0)) /
      60000
  );

  if (mode !== 'prompt') {
    return (
      <MaintenanceUpdateModal
        faultId={active._id}
        displayId={active.faultId}
        currentStatus="In progress"
        lockedStatus={mode}
        defaultActualDuration={mode === 'Completed' ? workedMinutes : undefined}
        minDuration={bookedMinutes}
        onClose={() => setMode('prompt')}
        onSuccess={() => onResolved()}
      />
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className={css.container}>
        <h2 className={css.title}>{t('title')}</h2>
        <p className={css.message}>
          {t('message')}{' '}
          <FaultIdBadge id={active.faultId} />
          {plantName ? <span className={css.plant}> · {plantName}</span> : null}
        </p>
        <p className={css.hint}>{t('hint')}</p>

        <div className={css.actions}>
          <Button
            type="button"
            className="button button--blue"
            onClick={() => setMode('Completed')}
          >
            {t('buttons.finalize')}
          </Button>
          <Button
            type="button"
            className="button button--white"
            onClick={() => setMode('Suspended')}
          >
            {t('buttons.suspend')}
          </Button>
          <Button
            type="button"
            className="button button--white"
            onClick={() => {
              router.push(`/maintenance-worker/${active._id}`);
              onClose();
            }}
          >
            {t('buttons.continue')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AlreadyWorkingModal;
