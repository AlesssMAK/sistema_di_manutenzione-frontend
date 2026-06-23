'use client';

import { useTranslations } from 'next-intl';
import type { AuditLogEntry } from '@/types/auditLogType';
import LogAuditCard from './LogAuditCard/LogAuditCard';
import css from './LogsAuditList.module.css';

interface LogsAuditListProps {
  entries: AuditLogEntry[];
  variant: 'access' | 'changes';
  onEntryClick: (entry: AuditLogEntry) => void;
}

const LogsAuditList = ({
  entries,
  variant,
  onEntryClick,
}: LogsAuditListProps) => {
  const t = useTranslations('AdminPage.LogsAudit');

  return (
    <div className={css.container}>
      {/* Desktop column headers — hidden under 1440px, each card
          prints its own field labels there. Widths must match the
          column widths in LogAuditCard.module.css. */}
      <div
        className={`${css.titleList} ${
          variant === 'changes' ? css.titleListChanges : ''
        }`}
      >
        <span className={`${css.title} ${css.dateCol}`}>
          {t('columns.date')}
        </span>
        <span className={`${css.title} ${css.actorCol}`}>
          {t('columns.actor')}
        </span>
        {variant === 'access' ? (
          <span className={`${css.title} ${css.roleCol}`}>
            {t('columns.role')}
          </span>
        ) : (
          <>
            <span className={`${css.title} ${css.actionCol}`}>
              {t('columns.changeType')}
            </span>
            <span className={`${css.title} ${css.detailsCol}`}>
              {t('columns.details')}
            </span>
          </>
        )}
      </div>

      {entries.map((entry) => (
        <LogAuditCard
          key={entry._id}
          entry={entry}
          variant={variant}
          onClick={onEntryClick}
        />
      ))}
    </div>
  );
};

export default LogsAuditList;
