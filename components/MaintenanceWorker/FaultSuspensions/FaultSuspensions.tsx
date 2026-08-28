'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format, isValid, parseISO } from 'date-fns';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import type { FaultCard } from '@/types/faultType';
import select from '@/components/UI/SelectDropdown/SelectDropdown.module.css';
import css from './FaultSuspensions.module.css';

type Suspension = NonNullable<FaultCard['suspensions']>[number];

interface FaultSuspensionsProps {
  /** PAST pauses only (the current active one is shown in the card
   *  callout). Each carries a date + reason. */
  suspensions?: Suspension[];
}

// History of the pauses a fault already went through (date + reason), in
// the neutral palette. A single pause is shown inline (it's short); two or
// more collapse into a disclosure list, same pattern as the materials
// panel. Self-hides when there's nothing to show.
const FaultSuspensions = ({ suspensions }: FaultSuspensionsProps) => {
  const t = useTranslations('FaultSuspensions');
  const locale = getDateFnsLocale(useLocale());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const items = suspensions ?? [];
  if (items.length === 0) return null;

  const fmt = (value?: string) => {
    if (!value) return '—';
    const parsed = parseISO(value);
    return isValid(parsed)
      ? format(parsed, 'dd MMM yyyy HH:mm', { locale })
      : value;
  };

  // Single pause → inline block (no disclosure, it's short).
  if (items.length === 1) {
    const s = items[0];
    return (
      <div className={css.single}>
        <div className={css.head}>
          <span className={css.label}>{t('one')}</span>
          <span className={css.date}>{fmt(s.suspendedAt)}</span>
        </div>
        {s.reason && <p className={css.reason}>{s.reason}</p>}
      </div>
    );
  }

  // Multiple pauses → collapsible list.
  return (
    <div className={select.select_dropdown_container} ref={ref}>
      <div
        className={`${select.input} ${open ? select.active : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(o => !o);
          }
        }}
      >
        <span className={select.value}>
          {t('title')} ({items.length})
        </span>
        <svg
          width="16"
          height="16"
          className={`${select.arrow} ${open ? select.up : select.down}`}
        >
          <use href="/sprite.svg#arrow_back_ios_new" />
        </svg>
      </div>

      {open && (
        <div className={select.menu}>
          <ul className={css.list}>
            {items.map((s, i) => (
              <li key={s._id ?? i} className={css.item}>
                <div className={css.head}>
                  <span className={css.index}>#{i + 1}</span>
                  <span className={css.date}>{fmt(s.suspendedAt)}</span>
                </div>
                {s.reason && <p className={css.reason}>{s.reason}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FaultSuspensions;
