'use client';

import { use, useEffect, useState } from 'react';
import { fetchFaultById } from '@/lib/api/faults';
import { FaultCard } from '@/types/faultType';
import toast from 'react-hot-toast';
import Image from 'next/image';
import css from './page.module.css';
import { useRouter } from 'next/navigation';

export default function FaultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [fault, setFault] = useState<FaultCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getFaultData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchFaultById(id);
        setFault(data);
      } catch (error) {
        toast.error('Errore во время загрузки данных');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) getFaultData();
  }, [id]);
  const handleBack = () => {
    router.push('/maintenance-worker');
  };

  if (isLoading) return <div className={css.loading}>Caricamento...</div>;
  if (!fault) return <div className={css.error}>Intervento non trovato</div>;

  return (
    <div className={css.container}>
      <div className={css.card}>
        <header className={css.header}>
          <div className={css.headerLeft}>
            {/* Кнопка-стрелка назад */}
            <button
              type="button"
              className={css.backButton}
              onClick={handleBack}
              title="Torna indietro"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <h2 className={css.title}>Dettaglio Intervento</h2>
          </div>
          <span className={css.idBadge}>{fault.faultId}</span>
        </header>

        <div className={css.infoGrid}>
          {/* Основная информация */}
          <div className={css.infoItem}>
            <label>Operatore</label>
            <p>{fault.nameOperator}</p>
          </div>
          <div className={css.infoItem}>
            <label>Stato</label>
            <span
              className={`${css.status} ${css[fault.statusFault || 'CREATED']}`}
            >
              {fault.statusFault}
            </span>
          </div>

          <div className={css.infoItem}>
            <label>Data di creazione</label>
            <p>
              {fault.dataCreated
                ? new Date(fault.dataCreated).toLocaleDateString('it-IT')
                : '---'}{' '}
              {fault.timeCreated || ''}
            </p>
          </div>
          <div className={css.infoItem}>
            <label>Ultimo aggiornamento</label>
            <p>{new Date(fault.updatedAt).toLocaleString('it-IT')}</p>
          </div>

          <div className={css.infoItem}>
            <label>Macchina (Plant)</label>
            <p>
              {fault.plantId?.namePlant} ({fault.plantId?.code})
            </p>
          </div>
          <div className={css.infoItem}>
            <label>Parte di impianto</label>
            <p>
              {fault.partId?.namePlantPart} ({fault.partId?.codePlantPart})
            </p>
          </div>

          <div className={css.infoItem}>
            <label>Tipo di guasto</label>
            <p>{fault.typeFault}</p>
          </div>
          <div className={css.infoItem}>
            <label>Priorità</label>
            <p className={css.priority}>{fault.priority}</p>
          </div>

          <div className={css.infoItem}>
            <label>Deadline (Дедлайн)</label>
            <p className={css.deadline}>
              {fault.deadline
                ? new Date(fault.deadline).toLocaleDateString('it-IT')
                : 'Non impostata'}
            </p>
          </div>
          <div className={css.infoItem}>
            <label>Tempo stimato (мин)</label>
            <p>{fault.estimatedDuration || 0} min</p>
          </div>
        </div>

        {/* Комментарии */}
        <div className={css.detailsBlock}>
          {/* Комментарий оператора — обычно он обязателен, но добавим проверку для надежности */}
          <div className={css.commentBox}>
            <label>Commento Operatore</label>
            <p>{fault.comment ? fault.comment : 'Commento assente'}</p>
          </div>

          {/* Комментарий менеджера */}
          <div className={css.commentBox}>
            <label>Commento Manager</label>
            <p>
              {fault.managerComment ? fault.managerComment : 'Commento assente'}
            </p>
          </div>

          {/* Комментарий рабочего (manutentore) */}
          <div className={css.commentBox}>
            <label>Commento Maintenance Worker</label>
            <p>
              {fault.commentMaintenanceWorker
                ? fault.commentMaintenanceWorker
                : 'Commento assente'}
            </p>
          </div>
        </div>

        {/* Фотографии */}
        {fault.img && fault.img.length > 0 && (
          <div className={css.imageSection}>
            <label>Foto allegate</label>
            <div className={css.imageGrid}>
              {fault.img.map((url, index) => (
                <div key={index} className={css.imageWrapper}>
                  <img
                    src={url}
                    alt={`Fault detail ${index}`}
                    className={css.image}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
