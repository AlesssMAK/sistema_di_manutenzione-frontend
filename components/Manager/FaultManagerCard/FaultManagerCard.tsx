'use client';

import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

/** Map raw backend statusFault to the StatusFault i18n key. */
const statusKey = (status: string | undefined) => {
  if (status === 'In progress') return 'IN_PROGRESS';
  if (status === 'Completed') return 'COMPLETED';
  if (status === 'Suspended') return 'SUSPENDED';
  if (status === 'Overdue') return 'OVERDUE';
  return 'CREATED';
};

const FaultManagerCard = ({
  fault,
  onPlan,
  detailHref,
}: FaultManagerCardProps) => {
  const router = useRouter();
  const t = useTranslations('FaultCard');
  const tStatus = useTranslations('StatusFault');
  const tType = useTranslations('TypeFault');
  const tPriority = useTranslations('Priority');

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
              title={`${t('badges.originalLabel')} ${fault.autoRescheduledFrom.plannedDate}${
                fault.autoRescheduledFrom.plannedTime
                  ? ' ' + fault.autoRescheduledFrom.plannedTime
                  : ''
              }`}
            >
              {t('badges.rescheduled')}
            </span>
          )}
          <span
            className={`${css.statusBadge} ${statusClass[fault.statusFault] ?? ''}`}
          >
            {tStatus(statusKey(fault.statusFault))}
          </span>
          <span
            className={`${css.typeBadge} ${
              fault.typeFault === 'Safety' ? css.typeSafety : css.typeProduction
            }`}
          >
            {tType(fault.typeFault === 'Safety' ? 'SAFETY' : 'PRODUCTION')}
          </span>
        </div>
      </div>

      <div className={css.section}>
        <div className={css.row}>
          <span className={css.label}>{t('labels.operator')}</span>
          <span className={css.value}>{fault.nameOperator || '—'}</span>
        </div>
        <div className={css.row}>
          <span className={css.label}>{t('labels.dateCreated')}</span>
          <span className={css.value}>
            {formatDate(fault.dataCreated)}
            {fault.timeCreated ? ` · ${fault.timeCreated}` : ''}
          </span>
        </div>
        <div className={css.row}>
          <span className={css.label}>{t('labels.plant')}</span>
          <span className={css.value}>
            {fault.plantId?.namePlant ?? '—'}
            {fault.plantId?.code ? ` (${fault.plantId.code})` : ''}
          </span>
        </div>
        <div className={css.row}>
          <span className={css.label}>{t('labels.plantPart')}</span>
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
          <span className={css.label}>{t('labels.description')}</span>
          <p className={css.commentText}>{fault.comment}</p>
        </div>
      )}

      {showAssignedSection && (
        <div className={css.planningBlock}>
          <div className={css.row}>
            <span className={css.label}>{t('labels.priority')}</span>
            <span
              className={`${css.priorityBadge} ${
                priorityClass[fault.priority] ?? ''
              }`}
            >
              {tPriority(fault.priority)}
            </span>
          </div>
          {fault.plannedDate && (
            <div className={css.row}>
              <span className={css.label}>{t('labels.planned')}</span>
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
              <span className={css.label}>{t('labels.deadline')}</span>
              <span className={css.value}>{formatDate(fault.deadline)}</span>
            </div>
          )}
          {(fault.assignedMaintainers?.length ?? 0) > 0 && (
            <div className={css.row}>
              <span className={css.label}>{t('labels.assignedTo')}</span>
              <div className={css.maintainerChips}>
                {fault.assignedMaintainers.map((m, i) => {
                  const isObj = typeof m === 'object' && m !== null;
                  const key = isObj ? m._id : String(m);
                  const name = isObj ? m.fullName : '—';
                  return (
                    <span
                      key={key ?? i}
                      className={css.maintainerChip}
                      title={isObj ? m.email : undefined}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {fault.managerComment && (
            <div className={css.commentBlock}>
              <span className={css.label}>{t('labels.managerNotes')}</span>
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
          {t('buttons.details')}
        </Button>
        {!isReadOnly && onPlan && (
          <Button
            type="button"
            className="button button--blue"
            onClick={() => onPlan(fault)}
          >
            {isPlanned ? t('buttons.modify') : t('buttons.plan')}
          </Button>
        )}
      </div>
    </li>
  );
};

export default FaultManagerCard;
