import Calendar from '../Calendar/Calendar';
import css from './CalendarBlock.module.css';

const CalendarBlock = () => {
  return (
    <div className={css.calendarBlockContainer}>
      <h3 className={css.calendarHeader}>Calendario</h3>
      <Calendar />
    </div>
  );
};
export default CalendarBlock;
