'use client';

import { format, isValid, parseISO } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import FaultIdBadge from '@/components/UI/FaultIdBadge/FaultIdBadge';
import type { FaultCard } from '@/types/faultType';
import css from './FaultRow.module.css';

const formatDay = (
  value: string | undefined,
  locale: ReturnType<typeof getDateFnsLocale>
) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'dd MMM yyyy', { locale }) : value;
};

const statusClass: Record<string, string> = {
  Created: css.statusCreated,
  'In progress': css.statusInProgress,
  Suspended: css.statusSuspended,
  Overdue: css.statusOverdue,
  Completed: css.statusCompleted,
};

const statusKey = (s: string) => {
  if (s === 'In progress') return 'IN_PROGRESS';
  if (s === 'Completed') return 'COMPLETED';
  if (s === 'Suspended') return 'SUSPENDED';
  if (s === 'Overdue') return 'OVERDUE';
  return 'CREATED';
};

interface FaultRowProps {
  fault: FaultCard;
}

/**
 * Single read-only fault row: id · plant/part · date · status. The canonical
 * "bacheca" row-card look (mobile-first with per-field captions, tablet+ one
 * line). Shared by the operator dashboard and the Bacheca "Segnalazioni" tab
 * — one source of truth for the row markup, helpers and status palette.
 */
export const FaultRow = ({ fault }: FaultRowProps) => {
  const t = useTranslations('FaultRow');
  const tStatus = useTranslations('StatusFault');
  const locale = getDateFnsLocale(useLocale());

  return (
    <li className={css.row}>
      <div className={css.head_container}>
        <div className={css.item_id}>
          <h3 className={css.title}>{t('labels.id')}</h3>
          <FaultIdBadge id={fault.faultId} />
        </div>
        <div className={css.item_date}>
          <h3 className={css.title}>{t('labels.date')}</h3>
          <p className={css.date}>{formatDay(fault.dataCreated, locale)}</p>
        </div>
      </div>

      <div className={css.item_plant}>
        <h3 className={css.title}>{t('labels.plant')}</h3>
        <p className={css.plant}>
          {fault.plantId?.namePlant ?? '—'}{' '}
          <span className={css.plantPart}>
            · {fault.partId?.namePlantPart ?? '—'}
          </span>
        </p>
      </div>

      <div className={css.item_status}>
        <h3 className={css.title}>{t('labels.status')}</h3>
        <span
          className={`${css.status} ${statusClass[fault.statusFault] ?? ''}`}
        >
          {tStatus(statusKey(fault.statusFault))}
        </span>
      </div>
    </li>
  );
};

interface FaultRowListProps {
  items: FaultCard[];
}

/** `<ul>` of FaultRow — the list container both callers share. */
export const FaultRowList = ({ items }: FaultRowListProps) => (
  <ul className={css.list}>
    {items.map(fault => (
      <FaultRow key={fault._id} fault={fault} />
    ))}
  </ul>
);

export default FaultRow;
