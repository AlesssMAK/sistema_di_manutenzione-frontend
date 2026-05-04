'use client';

import React from 'react';
import css from './FaultDeadlineOverview.module.css';
import { FaultCard } from '@/types/faultType';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface FaultDeadlineOverviewProps {
  faults: FaultCard[];
  selectedDate: string;
}

const FaultDeadlineOverview = ({
  faults,
  selectedDate,
}: FaultDeadlineOverviewProps) => {
  const router = useRouter();

  const displayDate = selectedDate
    ? format(new Date(selectedDate), 'MMMM yyyy', { locale: it })
    : format(new Date(), 'MMMM yyyy', { locale: it });

  const handleRowClick = (id: string) => {
    router.push(`/maintenance-worker/${id}`);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return css.statusCompleted;
      case 'Suspended':
        return css.statusSuspended;
      default:
        return css.statusInProgress;
    }
  };

  return (
    <div className={css.overviewContainer}>
      <h3 className={css.monthTitle}>
        {displayDate.charAt(0).toUpperCase() + displayDate.slice(1)}
      </h3>

      <div className={css.tableWrapper}>
        <table className={css.deadlineTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Macchina</th>
              <th>Parte di impianto</th>
              <th>Manutentore</th>
              <th>Priorità</th>
              <th>Scadenza</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {faults.map(fault => (
              <tr key={fault._id} className={css.tableRow}>
                <td className={css.idCell}>{fault.faultId}</td>
                <td>{fault.plantId?.namePlant || '---'}</td>
                <td>{fault.partId?.namePlantPart || '---'}</td>
                <td className={css.workerCell}>
                  {/* Вывод массива имен через запятую */}
                  {fault.assignedMaintainers &&
                  fault.assignedMaintainers.length > 0
                    ? fault.assignedMaintainers.join(', ')
                    : 'Non assegnato'}
                </td>
                <td>
                  <span
                    className={`${css.priorityBadge} ${css[fault.priority.toLowerCase()]}`}
                  >
                    {fault.priority}
                  </span>
                </td>
                <td className={css.deadlineCell}>
                  <span className={css.deadlineText}>
                    {fault.deadline
                      ? format(new Date(fault.deadline), 'dd/MM/yyyy HH:mm')
                      : '---'}
                  </span>
                </td>
                <td>
                  <span
                    className={`${css.statusBadge} ${getStatusClass(fault.statusFault)}`}
                  >
                    {fault.statusFault}
                  </span>
                </td>
                <td>
                  <button
                    className={css.detailsBtn}
                    onClick={() => handleRowClick(fault._id)}
                  >
                    Dettagli
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FaultDeadlineOverview;
