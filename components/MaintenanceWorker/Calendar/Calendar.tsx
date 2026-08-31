'use client';

import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import styles from './Calendar.module.css';

export type PlannedDayPriority = 'Low' | 'Medium' | 'High';

export interface PlannedDayBucket {
  count: number;
  /** Highest-severity priority among the day's planned faults; drives
   *  the badge colour. Null when count is 0. */
  highestPriority: PlannedDayPriority | null;
}

interface FilterDataCreatedBarProps {
  activeDataCreated: string;
  onDataCreatedChange: (dataCreated: string) => void;
  plannedDays?: Record<string, PlannedDayBucket>;
  /** 'completed' renders the day badge in the closed-count style (neutral
   *  green) instead of the priority-tinted planned badge. */
  variant?: 'planned' | 'completed';
}
const Calendar = ({
  activeDataCreated,
  onDataCreatedChange,
  plannedDays = {},
  variant = 'planned',
}: FilterDataCreatedBarProps) => {
  const t = useTranslations('maintenanceWorkerPage.calendar');
  const locale = getDateFnsLocale(useLocale());
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  // Monday-first headers (matches startOfWeek({ weekStartsOn: 1 }) below).
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
  const daysOfWeek = dayKeys.map(k => t(`daysOfWeek.${k}`));
  const handleDayClick = (day: Date) => {
    const formattedDate = format(day, 'yyyy-MM-dd');

    // sync month view when clicking a day from the previous/next month row
    // so the selected day stays visible in the calendar grid
    if (!isSameMonth(day, monthStart)) {
      setCurrentDate(day);
    }

    const newValue = activeDataCreated === formattedDate ? '' : formattedDate;
    onDataCreatedChange(newValue);
  };

  return (
    <div className={styles.calendarWrapper}>
      <div className={styles.header}>
        <button
          className={styles.navButton}
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
        >
          ‹
        </button>
        <h2 className={styles.monthTitle}>
          {format(currentDate, 'MMMM yyyy', { locale })}
        </h2>
        <button
          className={styles.navButton}
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
        >
          ›
        </button>
      </div>

      <div className={styles.daysHeader}>
        {daysOfWeek.map(day => (
          <div key={day} className={styles.dayName}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {calendarDays.map((day, idx) => {
          const formattedDay = format(day, 'yyyy-MM-dd');
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = activeDataCreated === formattedDay;
          const cellClasses = `
            ${styles.cell}
            ${!isCurrentMonth ? styles.otherMonth : ''}
            ${isSelected ? styles.selected : ''}
          `;

          const bucket = plannedDays[formattedDay];
          const count = bucket?.count ?? 0;
          const isCompleted = variant === 'completed';
          // Completed badges use one neutral "closed" style; planned badges
          // tint by the severity of the worst fault on that day so the
          // calendar reads like a heatmap at a glance.
          const badgeClass = isCompleted
            ? styles.plannedBadgeCompleted
            : bucket?.highestPriority === 'High'
              ? styles.plannedBadgeHigh
              : bucket?.highestPriority === 'Medium'
                ? styles.plannedBadgeMedium
                : bucket?.highestPriority === 'Low'
                  ? styles.plannedBadgeLow
                  : '';

          return (
            <div
              key={idx}
              className={cellClasses}
              onClick={() => handleDayClick(day)}
            >
              <span
                className={`${styles.dayNumber} ${isToday ? styles.today : ''}`}
              >
                {format(day, 'd')}
              </span>
              {/* Counter of faults for this day (current tab + scope) */}
              {count > 0 && (
                <span
                  className={`${styles.plannedBadge} ${badgeClass}`}
                  title={
                    isCompleted
                      ? t('completedCount', { count })
                      : t('interventionsCount', { count })
                  }
                >
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
