'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/UI/Modal/Modal';
import Button from '@/components/UI/Button/Button';
import { formatDuration } from '@/lib/utils/faultTime';
import FaultIdBadge from '@/components/UI/FaultIdBadge/FaultIdBadge';
import css from './OvertimeAlertModal.module.css';

interface OvertimeAlertModalProps {
  displayId: string;
  workedMinutes: number;
  plannedMinutes: number;
  /** Open the completion flow (the fault is actually done). */
  onComplete: () => void;
  /** Open the suspend flow (there is a blocking reason). */
  onSuspend: () => void;
  /** Keep working; the optional comment is logged on the fault. */
  onContinue: (comment?: string) => void;
  onClose: () => void;
  isSaving?: boolean;
}

const OvertimeAlertModal = ({
  displayId,
  workedMinutes,
  plannedMinutes,
  onComplete,
  onSuspend,
  onContinue,
  onClose,
  isSaving = false,
}: OvertimeAlertModalProps) => {
  const t = useTranslations('OvertimeAlert');
  const tDur = useTranslations('Duration');
  const [comment, setComment] = useState('');

  const u = { d: tDur('d'), h: tDur('h'), m: tDur('m') };

  return (
    <Modal onClose={onClose}>
      <div className={css.wrap}>
        <h2 className={css.title}>{t('title')}</h2>
        <p className={css.subtitle}>
          <FaultIdBadge id={displayId} />
        </p>

        <p className={css.message}>
          {t('message', {
            worked: formatDuration(workedMinutes, u),
            planned: formatDuration(plannedMinutes, u),
          })}
        </p>

        <div className={css.field}>
          <label className={css.label}>{t('commentLabel')}</label>
          <textarea
            className={css.textarea}
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t('commentPlaceholder')}
          />
        </div>

        <div className={css.actions}>
          <Button
            type="button"
            className="button button--white"
            onClick={onSuspend}
            disabled={isSaving}
          >
            {t('suspend')}
          </Button>
          <Button
            type="button"
            className="button button--white"
            onClick={onComplete}
            disabled={isSaving}
          >
            {t('complete')}
          </Button>
          <Button
            type="button"
            className="button button--blue"
            onClick={() => onContinue(comment.trim() || undefined)}
            disabled={isSaving}
          >
            {isSaving ? t('saving') : t('continue')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OvertimeAlertModal;
