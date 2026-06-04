'use client';

import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { FaultCard } from '@/types/faultType';
import Button from '@/components/UI/Button/Button';
import css from './FaultManagerCard.module.css';

interface FaultManagerCardProps {
  fault: FaultCard;
  onPlan?: (fault: FaultCard) => void;
  detailHref?: (fault: FaultCard) => string;
}

const formatDate = (value?: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'dd/MM/yyyy', { locale: it }) : value;
};

const priorityClass: Record<string, string> = {
  Low: css.priorityLow,
  Medium: css.priorityMedium,
  High: css.priorityHigh,
};

const statusClass: Record<string, string> = {
  Created: css.statusCreated,
  'In progress': css.statusInProgress,
  Suspended: css.statusSuspended,
  Overdue: css.statusOverdue,
  Completed: css.statusCompleted,
};

const FaultManagerCard = ({
  fault,
  onPlan,
  detailHref,
}: FaultManagerCardProps) => {
  const router = useRouter();

  const isPlanned = Boolean(fault.plannedDate);
  const isReadOnly = fault.statusFault === 'Completed';
  const showAssignedSection =
    isPlanned || (fault.assignedMaintainers?.length ?? 0) > 0;

  const handleDetail = () => {
    router.push(detailHref ? detailHref(fault) : `/manager/${fault._id}`);
  };

  return (
    <li className={css.card}>
      <div className={css.header}>
        <span className={css.faultId}>{fault.faultId}</span>
        <div className={css.badges}>
          {fault.autoRescheduledFrom?.plannedDate && (
            <span
              className={css.riprogrammatBadge}
              title={`Originale: ${fault.autoRescheduledFrom.plannedDate}${
                fault.autoRescheduledFrom.plannedTime
                  ? ' ' + fault.autoRescheduledFrom.plannedTime
                  : ''
              }`}
            >
              Riprogrammata
            </span>
          )}
          <span
            className={`${css.statusBadge} ${statusClass[fault.statusFault] ?? ''}`}
          >
            {fault.statusFault}
          </span>
          <span
            className={`${css.typeBadge} ${
              fault.typeFault === 'Safety' ? css.typeSafety : css.typeProduction
            }`}
          >
            {fault.typeFault}
          </span>
        </div>
      </div>

      <div className={css.section}>
        <div className={css.row}>
          <span className={css.label}>Operatore</span>
          <span className={css.value}>{fault.nameOperator || '—'}</span>
        </div>
        <div className={css.row}>
          <span className={css.label}>Data creazione</span>
          <span className={css.value}>
            {formatDate(fault.dataCreated)}
            {fault.timeCreated ? ` · ${fault.timeCreated}` : ''}
          </span>
        </div>
        <div className={css.row}>
          <span className={css.label}>Impianto</span>
          <span className={css.value}>
            {fault.plantId?.namePlant ?? '—'}
            {fault.plantId?.code ? ` (${fault.plantId.code})` : ''}
          </span>
        </div>
        <div className={css.row}>
          <span className={css.label}>Parte</span>
          <span className={css.value}>
            {fault.partId?.namePlantPart ?? '—'}
            {fault.partId?.codePlantPart
              ? ` (${fault.partId.codePlantPart})`
              : ''}
          </span>
        </div>
      </div>

      {fault.comment && (
        <div className={css.commentBlock}>
          <span className={css.label}>Descrizione</span>
          <p className={css.commentText}>{fault.comment}</p>
        </div>
      )}

      {showAssignedSection && (
        <div className={css.planningBlock}>
          <div className={css.row}>
            <span className={css.label}>Priorità</span>
            <span
              className={`${css.priorityBadge} ${
                priorityClass[fault.priority] ?? ''
              }`}
            >
              {fault.priority}
            </span>
          </div>
          {fault.plannedDate && (
            <div className={css.row}>
              <span className={css.label}>Pianificato</span>
              <span className={css.value}>
                {formatDate(fault.plannedDate)}
                {fault.plannedTime ? ` · ${fault.plannedTime}` : ''}
                {fault.estimatedDuration
                  ? ` · ${fault.estimatedDuration} min`
                  : ''}
              </span>
            </div>
          )}
          {fault.deadline && (
            <div className={css.row}>
              <span className={css.label}>Scadenza</span>
              <span className={css.value}>{formatDate(fault.deadline)}</span>
            </div>
          )}
          {(fault.assignedMaintainers?.length ?? 0) > 0 && (
            <div className={css.row}>
              <span className={css.label}>Assegnato a</span>
              <span className={css.value}>
                {fault.assignedMaintainers.length}{' '}
                {fault.assignedMaintainers.length === 1
                  ? 'manutentore'
                  : 'manutentori'}
              </span>
            </div>
          )}
          {fault.managerComment && (
            <div className={css.commentBlock}>
              <span className={css.label}>Note responsabile</span>
              <p className={css.commentText}>{fault.managerComment}</p>
            </div>
          )}
        </div>
      )}

      <div className={css.footer}>
        <Button
          type="button"
          className="button button--white"
          onClick={handleDetail}
        >
          Dettagli
        </Button>
        {!isReadOnly && onPlan && (
          <Button
            type="button"
            className="button button--blue"
            onClick={() => onPlan(fault)}
          >
            {isPlanned ? 'Modifica pianificazione' : 'Pianifica'}
          </Button>
        )}
      </div>
    </li>
  );
};

export default FaultManagerCard;
