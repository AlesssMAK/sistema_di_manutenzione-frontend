'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  format,
  parseISO,
  isValid,
  isSameDay,
  isSameMonth,
  isAfter,
  isBefore,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from 'date-fns';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import css from '../DatePickerInput/DatePickerInput.module.css';

interface DateRangePickerInputProps {
  /** ISO 'YYYY-MM-DD' or '' when unset. */
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  placeholder?: string;
  id?: string;
}

const toDate = (v: string) => (v && isValid(parseISO(v)) ? parseISO(v) : null);
const iso = (d: Date) => format(d, 'yyyy-MM-dd');

// Single-calendar range picker: first click sets the start, second the
// end (auto-ordered). Replaces two separate date fields.
const DateRangePickerInput = ({
  from,
  to,
  onChange,
  placeholder,
  id,
}: DateRangePickerInputProps) => {
  const locale = getDateFnsLocale(useLocale());
  const t = useTranslations('AdminPage.LogsAudit.datePicker');

  const [open, setOpen] = useState(false);
  const fromDate = toDate(from);
  const toDateVal = toDate(to);
  const [viewMonth, setViewMonth] = useState<Date>(
    () => fromDate ?? new Date()
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const openPicker = () => {
    setViewMonth(fromDate ?? new Date());
    setOpen(o => !o);
  };

  const pick = (day: Date) => {
    // No start yet, or a full range already picked → begin a new range.
    if (!fromDate || (fromDate && toDateVal)) {
      onChange(iso(day), '');
      return;
    }
    // Second click completes the range (auto-ordered), then closes.
    const start = isBefore(day, fromDate) ? day : fromDate;
    const end = isBefore(day, fromDate) ? fromDate : day;
    onChange(iso(start), iso(end));
    setOpen(false);
  };

  const monthStart = startOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekdayNames = days
    .slice(0, 7)
    .map(d => format(d, 'EEEEEE', { locale }));

  const triggerLabel =
    fromDate && toDateVal
      ? `${format(fromDate, 'P', { locale })} – ${format(toDateVal, 'P', { locale })}`
      : fromDate
        ? `${format(fromDate, 'P', { locale })} – …`
        : (placeholder ?? '');

  return (
    <div className={css.container} ref={ref}>
      <button
        type="button"
        id={id}
        className={`${css.trigger} ${open ? css.triggerOpen : ''}`}
        onClick={openPicker}
      >
        <span
          className={`${css.triggerLabel} ${!fromDate ? css.placeholder : ''}`}
        >
          {triggerLabel}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={css.calendarIcon}
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div className={css.popover}>
          <div className={css.header}>
            <button
              type="button"
              className={css.navButton}
              onClick={() => setViewMonth(m => subMonths(m, 1))}
              aria-label={t('prevMonth')}
            >
              ‹
            </button>
            <span className={css.monthTitle}>
              {format(viewMonth, 'LLLL yyyy', { locale })}
            </span>
            <button
              type="button"
              className={css.navButton}
              onClick={() => setViewMonth(m => addMonths(m, 1))}
              aria-label={t('nextMonth')}
            >
              ›
            </button>
          </div>

          <div className={css.daysHeader}>
            {weekdayNames.map((name, i) => (
              <div key={i} className={css.dayName}>
                {name}
              </div>
            ))}
          </div>

          <div className={css.grid}>
            {days.map((day, idx) => {
              const inMonth = isSameMonth(day, monthStart);
              const isStart = fromDate ? isSameDay(day, fromDate) : false;
              const isEnd = toDateVal ? isSameDay(day, toDateVal) : false;
              const isBetween =
                fromDate && toDateVal
                  ? isAfter(day, fromDate) && isBefore(day, toDateVal)
                  : false;
              const isEndpoint = isStart || isEnd;
              return (
                <button
                  type="button"
                  key={idx}
                  className={`${css.cell} ${!inMonth ? css.otherMonth : ''} ${
                    isEndpoint ? css.selected : isBetween ? css.inRange : ''
                  }`}
                  onClick={() => pick(day)}
                >
                  <span
                    className={`${css.dayNumber} ${
                      isEndpoint ? css.selectedText : ''
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={css.footer}>
            <button
              type="button"
              className={css.footerBtn}
              onClick={() => {
                onChange('', '');
                setOpen(false);
              }}
            >
              {t('clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePickerInput;
