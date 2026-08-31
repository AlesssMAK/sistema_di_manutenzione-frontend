import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import Calendar, {
  type PlannedDayBucket,
} from '../Calendar/Calendar';
import FilterPriorityBar from '../FilterPriorityBar/FilterPriorityBar';
import css from './CalendarBlock.module.css';

interface CalendarBlockProps {
  activePriority: string;
  onPriorityChange: (priority: string) => void;
  activeDate: string;
  onDateChange: (d: string) => void;
  plannedDays?: Record<string, PlannedDayBucket>;
  /** 'completed' switches the day badges to the closed-count style. */
  variant?: 'planned' | 'completed';
  /** Extra content shown in the sidebar below the priority legend
   *  (e.g. the Filtri panel). */
  children?: ReactNode;
}
const CalendarBlock = ({
  activePriority,
  onPriorityChange,
  activeDate,
  onDateChange,
  plannedDays = {},
  variant = 'planned',
  children,
}: CalendarBlockProps) => {
  const t = useTranslations('maintenanceWorkerPage.calendar');
  return (
    <div className={css.calendarBlockContainer}>
      <h3 className={css.calendarHeader}>{t('header')}</h3>
      <Calendar
        activeDataCreated={activeDate}
        onDataCreatedChange={onDateChange}
        plannedDays={plannedDays}
        variant={variant}
      />
      <FilterPriorityBar
        activePriority={activePriority}
        onPriorityChange={onPriorityChange}
      />
      {children}
    </div>
  );
};
export default CalendarBlock;
