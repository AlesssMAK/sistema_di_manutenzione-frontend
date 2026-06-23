'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  format,
  parseISO,
  isValid,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from 'date-fns';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import css from './DatePickerInput.module.css';

interface DatePickerInputProps {
  /** ISO date string 'YYYY-MM-DD' or '' when unset. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

const DatePickerInput = ({
  value,
  onChange,
  placeholder,
  id,
}: DatePickerInputProps) => {
  const localeCode = useLocale();
  const locale = getDateFnsLocale(localeCode);
  const t = useTranslations('AdminPage.LogsAudit.datePicker');

  const [open, setOpen] = useState(false);
  // Month the grid is currently showing; seeded from the selected
  // value (or today) each time the popover opens.
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    value && isValid(parseISO(value)) ? parseISO(value) : new Date()
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

  const selectedDate =
    value && isValid(parseISO(value)) ? parseISO(value) : null;

  const openPicker = () => {
    setViewMonth(selectedDate ?? new Date());
    setOpen((o) => !o);
  };

  const pick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const monthStart = startOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Localized Monday-first weekday initials, derived from the first
  // week of the grid so they follow the active date-fns locale.
  const weekdayNames = days.slice(0, 7).map((d) =>
    format(d, 'EEEEEE', { locale })
  );

  const triggerLabel = selectedDate
    ? format(selectedDate, 'P', { locale })
    : placeholder ?? '';

  return (
    <div className={css.container} ref={ref}>
      <button
        type="button"
        id={id}
        className={`${css.trigger} ${open ? css.triggerOpen : ''}`}
        onClick={openPicker}
      >
        <span
          className={`${css.triggerLabel} ${!selectedDate ? css.placeholder : ''}`}
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
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
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
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
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
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate
                ? isSameDay(day, selectedDate)
                : false;
              return (
                <button
                  type="button"
                  key={idx}
                  className={`${css.cell} ${!inMonth ? css.otherMonth : ''} ${
                    isSelected ? css.selected : ''
                  }`}
                  onClick={() => pick(day)}
                >
                  <span
                    className={`${css.dayNumber} ${
                      isToday && !isSelected ? css.today : ''
                    } ${isSelected ? css.selectedText : ''}`}
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
                onChange('');
                setOpen(false);
              }}
            >
              {t('clear')}
            </button>
            <button
              type="button"
              className={css.footerBtn}
              onClick={() => pick(new Date())}
            >
              {t('today')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePickerInput;
