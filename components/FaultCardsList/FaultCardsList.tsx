import Button from '../UI/Button/Button';
import css from './FaultCardsList.module.css';
import type { FaultCard } from '@/types/faultType';
import { useAuthStore } from '@/lib/store/authStore';
import ShowMoreButton from '../ShowmoreButton/ShowmoreButton';
import { useRouter } from 'next/navigation';

interface FaultCardsListProps {
  faults: FaultCard[];
}

const FaultCardsList = ({ faults }: FaultCardsListProps) => {
  const router = useRouter();
  const handleDetailClick = (id: string) => {
    router.push(`/maintenance-worker/${id}`);
  };
  if (!faults || faults.length === 0) {
    return <div className={css.container}>Nessuna segnalazione</div>;
  }
  const { user, isAuthenticated, clearIsAuthenticated } = useAuthStore();

  return (
    <div className={css.containerFaultCardList}>
      <ul className={css.faultList}>
        {faults.map(fault => (
          <li key={fault._id} className={css.faultCard}>
            <div className={css.content}>
              <div>
                <div className={css.header}>
                  <span className={css.faultId}>{fault.faultId}</span>
                  <div className={css.headerButton}>
                    <span className={css.status}>{fault.statusFault}</span>
                    <button type="button" className={css.buttonInProgress}>
                      In progress
                    </button>
                  </div>
                </div>

                <div className={css.details}>
                  <p className={css.namePlant}>
                    <strong>Macchina:</strong> {fault.plantId?.namePlant}
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
                  {/* Colonna sinistra */}
                  <div className={css.detailItem}>
                    <span className={css.label}>Parte</span>
                    <p className={css.value}>{fault.partId?.namePlantPart}</p>
                    <span className={css.label}>Ora pianificata</span>
                    <p className={css.value}>{fault.plannedTime}</p>
                    <span className={css.label}>Scadenza</span>
                    <p className={css.value}>{fault.deadline}</p>
                  </div>

                  {/* Colonna destra */}
                  <div className={css.detailItem}>
                    <span className={css.label}>Priorità</span>
                    <p className={`${css.value} ${css.priorityValue}`}>
                      {fault.priority}
                    </p>
                    <span className={css.label}>Durata stimata</span>
                    <p className={css.value}>{fault.estimatedDuration}</p>
                  </div>
                </div>
              </div>

              {fault.comment && (
                <div className={css.commentContainer}>
                  <h4 className={css.commentLabel}>Commento:</h4>
                  <p className={css.commentText}>{fault.comment}</p>
                </div>
              )}
            </div>
            <div className={css.shmorebtn}>
              <ShowMoreButton
                isLoading={false}
                onShowMore={() => handleDetailClick(fault._id)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FaultCardsList;
