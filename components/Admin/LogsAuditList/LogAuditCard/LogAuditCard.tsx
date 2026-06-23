'use client';

import { useTranslations } from 'next-intl';
import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import type { AuditAction, AuditLogEntry } from '@/types/auditLogType';
import css from './LogAuditCard.module.css';

interface LogAuditCardProps {
  entry: AuditLogEntry;
  /** access = date/actor/role · changes = date/actor/action/details */
  variant: 'access' | 'changes';
  onClick: (entry: AuditLogEntry) => void;
}

const actionTone = (action: AuditAction): string => {
  if (action.endsWith('.create')) return css.toneCreate;
  if (action.endsWith('.update')) return css.toneUpdate;
  if (action.endsWith('.delete')) return css.toneDelete;
  if (
    action.endsWith('.assign') ||
    action.endsWith('.reassign') ||
    action.endsWith('.statusChange') ||
    action.endsWith('.auto_overdue') ||
    action.endsWith('.auto_replanned')
  )
    return css.toneAssign;
  if (action.endsWith('.verify') || action.endsWith('.broadcast'))
    return css.toneVerify;
  return css.toneNeutral;
};

const roleTone = (role: string): string => {
  if (role === 'admin') return css.roleAdmin;
  if (role === 'manager') return css.roleManager;
  if (role === 'maintenanceWorker') return css.roleMaintainer;
  if (role === 'safety') return css.roleSafety;
  if (role === 'operator') return css.roleOperator;
  return css.roleSystem;
};

const actorLabel = (entry: AuditLogEntry) => {
  const actor = entry.actorId;
  if (actor && typeof actor === 'object') {
    if (actor.fullName) return actor.fullName;
    if (actor.email) return actor.email;
  }
  return '—';
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed)
    ? format(parsed, 'dd/MM/yyyy HH:mm:ss', { locale: it })
    : value;
};

const LogAuditCard = ({ entry, variant, onClick }: LogAuditCardProps) => {
  const t = useTranslations('AdminPage.LogsAudit');
  const tRoles = useTranslations('Roles');

  // next-intl treats dots as nesting, so the flat enum key
  // `part.create` is stored as `part_create`.
  const actionLabel = (action: AuditAction) => {
    const key = `actions.${action.replaceAll('.', '_')}`;
    return t.has(key) ? t(key) : action;
  };

  const roleLabel =
    entry.actorRole === 'system' ? t('system') : tRoles(entry.actorRole);

  return (
    <div
      className={`${css.card} ${variant === 'changes' ? css.cardChanges : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onClick(entry)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(entry);
        }
      }}
    >
      <div className={`${css.cell} ${css.dateCell}`}>
        <h3 className={css.label}>{t('columns.date')}</h3>
        <p className={css.date}>{formatDateTime(entry.createdAt)}</p>
      </div>

      <div className={`${css.cell} ${css.actorCell}`}>
        <h3 className={css.label}>{t('columns.actor')}</h3>
        <p className={css.actor}>{actorLabel(entry)}</p>
      </div>

      {variant === 'access' ? (
        <div className={`${css.cell} ${css.roleCell}`}>
          <h3 className={css.label}>{t('columns.role')}</h3>
          <span className={`${css.rolePill} ${roleTone(entry.actorRole)}`}>
            {roleLabel}
          </span>
        </div>
      ) : (
        <>
          <div className={`${css.cell} ${css.actionCell}`}>
            <h3 className={css.label}>{t('columns.changeType')}</h3>
            <span
              className={`${css.actionPill} ${actionTone(entry.action)}`}
              title={entry.action}
            >
              {actionLabel(entry.action)}
            </span>
          </div>
          <div className={`${css.cell} ${css.detailsCell}`}>
            <h3 className={css.label}>{t('columns.details')}</h3>
            <p className={css.details}>
              {entry.summary || t('columns.openDetail')}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default LogAuditCard;
