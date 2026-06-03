'use client';

import { useRouter } from 'next/navigation';
import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import type { FaultCard } from '@/types/faultType';
import css from './DaySlotGrid.module.css';

interface DaySlotGridProps {
  selectedDate: string;
  faults: FaultCard[];
  startHour?: number;
  endHour?: number;
}

const priorityClass: Record<string, string> = {
  Low: css.priorityLow,
  Medium: css.priorityMedium,
  High: css.priorityHigh,
};

const formatDayTitle = (date: string) => {
  const parsed = parseISO(date);
  return isValid(parsed)
    ? format(parsed, 'EEEE, d MMMM yyyy', { locale: it })
    : date;
};

const DaySlotGrid = ({
  selectedDate,
  faults,
  startHour = 8,
  endHour = 17,
}: DaySlotGridProps) => {
  const router = useRouter();
  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => i + startHour
  );

  const dayFaults = faults.filter(f => f.plannedDate === selectedDate);

  return (
    <div className={css.container}>
      <h3 className={css.title}>
        Vista giornaliera · {formatDayTitle(selectedDate)}
      </h3>

      <div className={css.grid}>
        {hours.map(hour => {
          const slotFaults = dayFaults.filter(f => {
            if (!f.plannedTime) return false;
            const [h] = f.plannedTime.split(':');
            return Number(h) === hour;
          });

          return (
            <div key={hour} className={css.slot}>
              <div className={css.slotHour}>
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className={css.slotContent}>
                {slotFaults.length === 0 ? (
                  <span className={css.slotEmpty}>—</span>
                ) : (
                  slotFaults.map(f => (
                    <button
                      key={f._id}
                      type="button"
                      className={`${css.slotCard} ${priorityClass[f.priority] ?? ''}`}
                      onClick={() => router.push(`/maintenance-worker/${f._id}`)}
                    >
                      <span className={css.slotFaultId}>{f.faultId}</span>
                      <span className={css.slotPlant}>
                        {f.plantId?.namePlant ?? '—'}
                      </span>
                      {f.plannedTime && (
                        <span className={css.slotTime}>
                          {f.plannedTime}
                          {f.estimatedDuration
                            ? ` · ${f.estimatedDuration} min`
                            : ''}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DaySlotGrid;
