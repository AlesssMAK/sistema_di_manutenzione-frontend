import Calendar from '../Calendar/Calendar';
import FilterPriorityBar from '../FilterPriorityBar/FilterPriorityBar';
import css from './CalendarBlock.module.css';

const CalendarBlock = () => {
  return (
    <div className={css.calendarBlockContainer}>
      <h3 className={css.calendarHeader}>Calendario</h3>
      <Calendar />
      <FilterPriorityBar />
    </div>
  );
};
export default CalendarBlock;
