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
import styles from './Calendar.module.css';

interface FilterDataCreatedBarProps {
  activeDataCreated: string;
  onDataCreatedChange: (dataCreated: string) => void;
  deadlineDates?: string[];
  isDeadlineMode?: boolean;
}
const Calendar = ({
  activeDataCreated,
  onDataCreatedChange,
  deadlineDates = [],
  isDeadlineMode = false,
}: FilterDataCreatedBarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const daysOfWeek = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];
  const handleDayClick = (day: Date) => {
    const formattedDate = format(day, 'yyyy-MM-dd');

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
              {/* Точку оставляем по желанию или убираем, если заливка важнее */}
              {hasDeadline && !isDeadlineMode && (
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
