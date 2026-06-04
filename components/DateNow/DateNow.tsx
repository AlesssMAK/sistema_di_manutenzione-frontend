import React from 'react';
import { format, isToday, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import css from './DateNow.module.css';

type DateNowMode = 'default' | 'overdue' | 'completed';

interface DateNowProps {
  selectedDate?: string;
  mode?: DateNowMode;
  priority?: string;
}

const priorityLabel = (priority?: string) => {
  if (!priority) return '';
  if (priority === 'Low') return ', priorità: Bassa';
  if (priority === 'Medium') return ', priorità: Media';
  if (priority === 'High') return ', priorità: Alta';
  return `, priorità: ${priority}`;
};

const DateNow = ({
  selectedDate,
  mode = 'default',
  priority,
}: DateNowProps) => {
  const prioritySuffix = priorityLabel(priority);

  if (mode === 'overdue') {
    return (
      <p className={css.dateDisplay}>
        Segnalazioni scadute{prioritySuffix}
      </p>
    );
  }

  if (mode === 'completed' && !selectedDate) {
    return (
      <p className={css.dateDisplay}>
        Storico segnalazioni completate{prioritySuffix}
      </p>
    );
  }

  if (selectedDate) {
    const parsed = parseISO(selectedDate);
    if (isValid(parsed)) {
      const formatted = format(parsed, 'EEEE, d MMMM yyyy', { locale: it });
      const prefix =
        mode === 'completed'
          ? 'Completate del:'
          : isToday(parsed)
            ? 'Oggi,'
            : 'Attività del:';
      const label = `${prefix} ${formatted}`;
      return (
        <p className={css.dateDisplay}>
          {label}
          {prioritySuffix}
        </p>
      );
    }
  }

  return (
    <p className={css.dateDisplay}>
      Tutte le segnalazioni attive{prioritySuffix}
    </p>
  );
};

export default DateNow;
