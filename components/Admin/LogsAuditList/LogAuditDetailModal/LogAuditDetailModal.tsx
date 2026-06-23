'use client';

import { useTranslations } from 'next-intl';
import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import Modal from '@/components/UI/Modal/Modal';
import type { AuditLogEntry } from '@/types/auditLogType';
import css from './LogAuditDetailModal.module.css';

// Mongo ObjectId / Buffer fields stored in meta serialize as a raw
// byte map — { buffer: { 0: 106, 1: 52, … } } or the Node Buffer
// shape { type: 'Buffer', data: [...] }. Collapse those into the
// readable hex string they actually represent so the "Dati
// aggiuntivi" JSON shows e.g. "6a3441…" instead of a byte dump.
const bytesToHex = (bytes: Record<string, number> | number[]): string =>
  Object.values(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const normalizeMeta = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeMeta);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (
      obj.buffer &&
      typeof obj.buffer === 'object' &&
      !Array.isArray(obj.buffer)
    ) {
      return bytesToHex(obj.buffer as Record<string, number>);
    }
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return bytesToHex(obj.data as number[]);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = normalizeMeta(v);
    return out;
  }
  return value;
};

interface LogAuditDetailModalProps {
  entry: AuditLogEntry;
  onClose: () => void;
}

const formatFull = (value?: string) => {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed)
    ? format(parsed, "dd MMMM yyyy 'alle' HH:mm:ss", { locale: it })
    : value;
};

const actorLabel = (entry: AuditLogEntry) => {
  const actor = entry.actorId;
  if (actor && typeof actor === 'object') {
    if (actor.fullName) return actor.fullName;
    const composed = [actor.name, actor.lastname].filter(Boolean).join(' ');
    if (composed) return composed;
    if (actor.email) return actor.email;
  }
  return '—';
};

const LogAuditDetailModal = ({ entry, onClose }: LogAuditDetailModalProps) => {
  const t = useTranslations('AdminPage.LogsAudit.detail');
  const tLog = useTranslations('AdminPage.LogsAudit');
  const tRoles = useTranslations('Roles');

  // next-intl treats dots as nesting, so the flat enum key
  // `auth.login` is stored as `auth_login`; fall back to the raw
  // enum if a key is missing.
  const actionKey = `actions.${entry.action.replaceAll('.', '_')}`;
  const actionLabel = tLog.has(actionKey) ? tLog(actionKey) : entry.action;

  return (
    <Modal onClose={onClose}>
      <div className={css.container}>
        <div className={css.titleContainer}>
          <h1 className="title">{t('title')}</h1>
          <p className="subtitle">{actionLabel}</p>
        </div>

        <dl className={css.meta}>
          <dt className={css.metaLabel}>{t('date')}</dt>
          <dd className={css.metaValue}>{formatFull(entry.createdAt)}</dd>

          <dt className={css.metaLabel}>{t('actor')}</dt>
          <dd className={css.metaValue}>
            {actorLabel(entry)} · {tRoles(entry.actorRole)}
          </dd>

          <dt className={css.metaLabel}>{t('target')}</dt>
          <dd className={css.metaValue}>
            {entry.targetType ?? '—'}
            {entry.targetId ? (
              <span className={css.mono}> · {entry.targetId}</span>
            ) : null}
          </dd>

          {entry.summary && (
            <>
              <dt className={css.metaLabel}>{t('summary')}</dt>
              <dd className={css.metaValue}>{entry.summary}</dd>
            </>
          )}

          {entry.ip && (
            <>
              <dt className={css.metaLabel}>{t('ip')}</dt>
              <dd className={`${css.metaValue} ${css.mono}`}>{entry.ip}</dd>
            </>
          )}

          {entry.userAgent && (
            <>
              <dt className={css.metaLabel}>{t('userAgent')}</dt>
              <dd className={`${css.metaValue} ${css.mono} ${css.wrap}`}>
                {entry.userAgent}
              </dd>
            </>
          )}
        </dl>

        {entry.meta && Object.keys(entry.meta).length > 0 && (
          <div className={css.metaBlock}>
            <h3 className={css.metaBlockTitle}>{t('extra')}</h3>
            <pre className={css.metaJson}>
              {JSON.stringify(normalizeMeta(entry.meta), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LogAuditDetailModal;
