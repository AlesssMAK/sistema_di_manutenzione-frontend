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
}
const CalendarBlock = ({
  activePriority,
  onPriorityChange,
  activeDate,
  onDateChange,
  deadlineDates = [],
  isDeadlineMode = false,
}: CalendarBlockProps) => {
  return (
    <div className={css.calendarBlockContainer}>
      <h3 className={css.calendarHeader}>Calendario</h3>
      <Calendar
        activeDataCreated={activeDate}
        onDataCreatedChange={onDateChange}
        deadlineDates={deadlineDates}
        isDeadlineMode={isDeadlineMode}
      />
      <FilterPriorityBar
        activePriority={activePriority}
        onPriorityChange={onPriorityChange}
      />
    </div>
  );
};
export default CalendarBlock;
