'use client';

import React, { useState } from 'react';
import css from './MaintenanceUpdateModal.module.css';
import { updateFaultByWorker } from '@/lib/api/faults';
import toast from 'react-hot-toast';

import Button from '../UI/Button/Button';
import SelectDropdown from '../UI/SelectDropdown/SelectDropdown';

interface MaintenanceUpdateModalProps {
  faultId: string;
  displayId: string;
  onClose: () => void;
  onSuccess: (updatedFault: any) => void;
}

const STATUS_OPTIONS = ['Created', 'In progress', 'Completed', 'Suspended'];

const MaintenanceUpdateModal: React.FC<MaintenanceUpdateModalProps> = ({
  faultId,
  displayId,
  onClose,
  onSuccess,
}) => {
  const [status, setStatus] = useState('In progress');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error('Il commento è obbligatorio');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateFaultByWorker({
        faultId: faultId,
        statusFault: status,
        commentMaintenanceWorker: comment,
      });

      toast.success('Intervento aggiornato con successo!');

      onSuccess({
        statusFault: status,
        commentMaintenanceWorker: comment,
      });

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error(error);
      toast.error('Errore во время обновления данных');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={css.overlay} onClick={onClose}>
      <div className={css.modal} onClick={e => e.stopPropagation()}>
        <div className={css.header}>
          <h3>Aggiorna Intervento</h3>
          <span className={css.idBadge}>{displayId}</span>
          <button className={css.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={css.form}>
          <div className={css.field}>
            <label className={css.label}>Stato Intervento</label>
            <SelectDropdown
              options={STATUS_OPTIONS}
              selectedValue={status}
              onSelect={value => setStatus(value)}
              placeholder="Seleziona stato"
            />
          </div>

          <div className={css.field}>
            <label className={css.label}>Commento Manutentore</label>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Inserisci i dettagli del lavoro svolto..."
              className={css.textarea}
              required
            />
          </div>

          <div className={css.actions}>
            <Button
              className={css.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annulla
            </Button>

            <Button
              type="submit"
              className={css.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Inviando...' : 'Conferma e Salva'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceUpdateModal;
