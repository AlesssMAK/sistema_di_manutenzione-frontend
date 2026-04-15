import Calendar from '../Calendar/Calendar';
import FilterPriorityBar from '../FilterPriorityBar/FilterPriorityBar';
import css from './CalendarBlock.module.css';
interface CalendarBlockProps {
  activePriority: string;
  onPriorityChange: (priority: string) => void;
}
const CalendarBlock = ({
  activePriority,
  onPriorityChange,
}: CalendarBlockProps) => {
  return (
    <div className={css.calendarBlockContainer}>
      <h3 className={css.calendarHeader}>Calendario</h3>
      <Calendar />
      <FilterPriorityBar
        activePriority={activePriority}
        onPriorityChange={onPriorityChange}
      />
    </div>
  );
};
export default CalendarBlock;
