import Button from '../UI/Button/Button';
import css from './FaultCardsList.module.css';
import type { FaultCard } from '@/types/faultType';

interface FaultCardsListProps {
  faults: FaultCard[];
}

const FaultCardsList = ({ faults }: FaultCardsListProps) => {
  if (!faults || faults.length === 0) {
    return <div className={css.container}>Задач пока нет</div>;
  }

  return (
    <div className={css.containerFaultCardList}>
      <h3 className={css.datanowForList}>Data</h3>
      <ul className={css.faultList}>
        {faults.map(fault => (
          <li key={fault.id} className={css.faultCard}>
            <div className={css.content}>
              <div>
                <div className={css.header}>
                  <span className={css.faultId}>{fault.faultId}</span>
                  <div className={css.headerButton}>
                    <span className={css.status}>{fault.statusfault}</span>
                    <button type="button" className={css.buttonInProgress}>
                      In progress
                    </button>
                  </div>
                </div>

                <div className={css.details}>
                  <p className={css.namePlant}>
                    <strong>Установка:</strong> {fault.plantId?.namePlant}
                  </p>
                </div>
                <Button
                  type="button"
                  className="button--white"
                  width={115}
                  height={23}
                >
                  <svg className={css.user_icon} width="16" height="16">
                    <use href="/sprite.svg#user"></use>
                  </svg>
                </Button>
                <p>
                  <strong>Часть установки:</strong>{' '}
                  {fault.partId?.namePlantPart}
                </p>
                <p>
                  <strong>Приоритет:</strong> {fault.priority}
                </p>
              </div>

              {fault.comment && <p className={css.comment}>{fault.comment}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FaultCardsList;
