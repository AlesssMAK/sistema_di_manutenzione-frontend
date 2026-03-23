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
import { it } from 'date-fns/locale';
import styles from './Calendar.module.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const daysOfWeek = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

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
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);

          const cellClasses = `
            ${styles.cell} 
            ${!isCurrentMonth ? styles.otherMonth : ''}
          `;

          const dayClasses = `
            ${styles.dayNumber} 
            ${isToday ? styles.today : ''}
          `;

          return (
            <div key={idx} className={cellClasses}>
              <span className={dayClasses}>{format(day, 'd')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
