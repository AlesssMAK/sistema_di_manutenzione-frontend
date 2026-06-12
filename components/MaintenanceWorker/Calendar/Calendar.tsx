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
  parseISO,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import styles from './Calendar.module.css';

interface FilterDataCreatedBarProps {
  activeDataCreated: string;
  onDataCreatedChange: (dataCreated: string) => void;
  deadlineDates?: string[];
  isDeadlineMode?: boolean;
  plannedCounts?: Record<string, number>;
}
const Calendar = ({
  activeDataCreated,
  onDataCreatedChange,
  deadlineDates = [],
  isDeadlineMode = false,
  plannedCounts = {},
}: FilterDataCreatedBarProps) => {
  const t = useTranslations('maintenanceWorkerPage.calendar');
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
          {format(currentDate, 'MMMM yyyy', { locale: it })}
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
          const hasDeadline = deadlineDates.includes(formattedDay);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = activeDataCreated === formattedDay;
          // const isSelected =
          //   activeDataCreated && isSameDay(day, parseISO(activeDataCreated));
          const cellClasses = `
            ${styles.cell} 
            ${!isCurrentMonth ? styles.otherMonth : ''}
            ${isSelected ? styles.selected : ''}
            ${isDeadlineMode && hasDeadline ? styles.deadlineCell : ''}
          `;

          const dayClasses = `
            ${styles.dayNumber} 
            ${isToday ? styles.today : ''}
            ${isSelected ? styles.selectedText : ''}
          `;

          const plannedCount = plannedCounts[formattedDay] ?? 0;

          return (
            <div
              key={idx}
              className={cellClasses}
              onClick={() => handleDayClick(day)}
            >
              <span
                className={`${styles.dayNumber} ${isSameDay(day, new Date()) ? styles.today : ''}`}
              >
                {format(day, 'd')}
              </span>
              {/* Counter of planned interventions for this day (current scope) */}
              {plannedCount > 0 && !isDeadlineMode && (
                <span
                  className={styles.plannedBadge}
                  title={t('interventionsCount', { count: plannedCount })}
                >
                  {plannedCount}
                </span>
              )}
              {hasDeadline && !isDeadlineMode && plannedCount === 0 && (
                <div className={styles.deadlineDot} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
