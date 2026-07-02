import React from 'react';
import { format, isToday, isValid, parseISO } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import css from './DateNow.module.css';

type DateNowMode = 'default' | 'overdue' | 'completed';

interface DateNowProps {
  selectedDate?: string;
  mode?: DateNowMode;
  priority?: string;
}

const DateNow = ({
  selectedDate,
  mode = 'default',
  priority,
}: DateNowProps) => {
  const t = useTranslations('maintenanceWorkerPage.dateNow');
  const tPriority = useTranslations('Priority');
  const locale = getDateFnsLocale(useLocale());

  const prioritySuffix = priority
    ? t('prioritySuffix', {
        priority:
          priority === 'Low' || priority === 'Medium' || priority === 'High'
            ? tPriority(priority)
            : priority,
      })
    : '';

  if (mode === 'overdue') {
    return (
      <p className={css.dateDisplay}>
        {t('overdue')}
        {prioritySuffix}
      </p>
    );
  }

  if (mode === 'completed' && !selectedDate) {
    return (
      <p className={css.dateDisplay}>
        {t('completedHistory')}
        {prioritySuffix}
      </p>
    );
  }

  if (selectedDate) {
    const parsed = parseISO(selectedDate);
    if (isValid(parsed)) {
      const formatted = format(parsed, 'EEEE, d MMMM yyyy', { locale });
      const prefix =
        mode === 'completed'
          ? t('completedOf')
          : isToday(parsed)
            ? t('today')
            : t('activityOf');
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
      {t('allActive')}
      {prioritySuffix}
    </p>
  );
};

export default DateNow;
