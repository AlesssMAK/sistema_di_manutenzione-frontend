import css from './FilterPriorityBar.module.css';
import { TYPE_PRIORITY } from '@/constants/priorityFaults';

interface FilterPriorityBarProps {
  activePriority: string;
  onPriorityChange: (priority: string) => void;
}
const FilterPriorityBar = ({
  activePriority,
  onPriorityChange,
}: FilterPriorityBarProps) => {
  const priorities = [
    {
      id: TYPE_PRIORITY.LOW,
      label: 'Priority Low',
      class: css.bassa,
      span: css.bassaSpan,
    },
    {
      id: TYPE_PRIORITY.MEDIUM,
      label: 'Priority Medium',
      class: css.media,
      span: css.mediaSpan,
    },
    {
      id: TYPE_PRIORITY.HIGH,
      label: 'Priority High',
      class: css.alta,
      span: css.altaSpan,
    },
  ];
  return (
    <div>
      <h3 className={css.headersFilter}>Legenda Priorità</h3>
      <ul className={css.listPriority}>
        {priorities.map(p => (
          <li key={p.id} className={activePriority === p.id ? css.active : ''}>
            <button className={p.class} onClick={() => onPriorityChange(p.id)}>
              <span className={p.span}></span>
              {p.label}
            </button>
          </li>
        ))}
      </ul>
      {activePriority && (
        <button onClick={() => onPriorityChange('')} className={css.resetBtn}>
          Сбросить фильтр
        </button>
      )}
    </div>
  );
};
export default FilterPriorityBar;
