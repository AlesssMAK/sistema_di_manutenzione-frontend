import Button from '../UI/Button/Button';
import css from './FaultCardsList.module.css';
import type { FaultCard } from '@/types/faultType';
import { useAuthStore } from '@/lib/store/authStore';

interface FaultCardsListProps {
  faults: FaultCard[];
}

const FaultCardsList = ({ faults }: FaultCardsListProps) => {
  if (!faults || faults.length === 0) {
    return <div className={css.container}>Задач пока нет</div>;
  }
  const { user, isAuthenticated, clearIsAuthenticated } = useAuthStore();

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
                  width={160}
                  height={30}
                >
                  <div className={css.user}>
                    <svg className={css.user_icon} width="12" height="12">
                      <use href="/sprite.svg#user"></use>
                    </svg>
                    <p className={css.user_name}>{user?.fullName}</p>
                  </div>
                </Button>
                <div className={css.detailsGrid}>
                  {/* Левая колонка */}
                  <div className={css.detailItem}>
                    <span className={css.label}>Часть установки</span>
                    <p className={css.value}>{fault.partId?.namePlantPart}</p>
                    <span className={css.label}>Плановое время</span>
                    <p className={css.value}>{fault.plannedTime}</p>
                  </div>

                  {/* Правая колонка */}
                  <div className={css.detailItem}>
                    <span className={css.label}>Приоритет</span>
                    <p className={`${css.value} ${css.priorityValue}`}>
                      {fault.priority}
                    </p>
                    <span className={css.label}>Общее время выполнения</span>
                    <p className={css.value}>{fault.estimatedDuration}</p>
                  </div>
                </div>
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
