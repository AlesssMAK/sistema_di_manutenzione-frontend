import { useTranslations } from 'next-intl';
import Calendar from '../Calendar/Calendar';
import FilterPriorityBar from '../FilterPriorityBar/FilterPriorityBar';
import css from './CalendarBlock.module.css';
interface CalendarBlockProps {
  activePriority: string;
  onPriorityChange: (priority: string) => void;
  activeDate: string;
  onDateChange: (d: string) => void;
  deadlineDates?: string[];
  isDeadlineMode?: boolean;
  plannedCounts?: Record<string, number>;
}
const CalendarBlock = ({
  activePriority,
  onPriorityChange,
  activeDate,
  onDateChange,
  deadlineDates = [],
  isDeadlineMode = false,
  plannedCounts = {},
}: CalendarBlockProps) => {
  const t = useTranslations('maintenanceWorkerPage.calendar');
  return (
    <div className={css.calendarBlockContainer}>
      <h3 className={css.calendarHeader}>{t('header')}</h3>
      <Calendar
        activeDataCreated={activeDate}
        onDataCreatedChange={onDateChange}
        deadlineDates={deadlineDates}
        isDeadlineMode={isDeadlineMode}
        plannedCounts={plannedCounts}
      />
      <FilterPriorityBar
        activePriority={activePriority}
        onPriorityChange={onPriorityChange}
      />
    </div>
  );
};
export default CalendarBlock;
