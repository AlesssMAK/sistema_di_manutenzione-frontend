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
              <div className={css.header}>
                <span className={css.faultId}>{fault.faultId}</span>
                <span className={css.status}>{fault.statusfault}</span>
              </div>

              <div className={css.details}>
                <p>
                  <strong>Оборудование:</strong> {fault.plantId?.namePlant}
                </p>
                <p>
                  <strong>Узел:</strong> {fault.partId?.namePartPlant}
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
