import Button from '@/components/UI/Button/Button';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('maintenanceWorkerPage.priorityLegend');
  const tPriority = useTranslations('Priority');

  const priorities = [
    { id: TYPE_PRIORITY.LOW, rowClass: css.rowLow },
    { id: TYPE_PRIORITY.MEDIUM, rowClass: css.rowMedium },
    { id: TYPE_PRIORITY.HIGH, rowClass: css.rowHigh },
  ];

  return (
    <div>
      <h3 className={css.header}>{t('title')}</h3>
      <ul className={css.list}>
        {priorities.map(p => {
          const isActive = activePriority === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`${css.row} ${p.rowClass} ${isActive ? css.active : ''}`}
                onClick={() => onPriorityChange(p.id)}
                aria-pressed={isActive}
              >
                <span className={css.dot} />
                {tPriority(p.id)}
              </button>
            </li>
          );
        })}
      </ul>
      {activePriority && (
        <Button
          type="button"
          onClick={() => onPriorityChange('')}
          className={`button button--blue ${css.btn}`}
        >
          {t('reset')}
        </Button>
      )}
    </div>
  );
};
export default FilterPriorityBar;
