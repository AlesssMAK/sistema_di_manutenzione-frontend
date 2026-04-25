'use client';

import React, { useState } from 'react';
import css from './MaintenanceUpdateModal.module.css';
import { updateFaultByWorker } from '@/lib/api/faults';
import toast from 'react-hot-toast';

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

    setIsSubmitting(true);

    try {
      await updateFaultByWorker({
        faultId: faultId,
        statusFault: status,
        commentMaintenanceWorker: comment,
      });

      onSuccess({
        statusFault: status,
        commentMaintenanceWorker: comment,
      });
    } catch (error) {}
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
            <label>Stato Intervento</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className={css.select}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className={css.field}>
            <label>Commento Manutentore</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Inserisci i dettagli del lavoro svolto..."
              className={css.textarea}
              required
            />
          </div>

          <div className={css.actions}>
            <button
              type="button"
              className={css.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className={css.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Inviando...' : 'Conferma e Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceUpdateModal;
