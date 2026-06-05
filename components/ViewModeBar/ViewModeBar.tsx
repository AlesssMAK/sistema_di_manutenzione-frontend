'use client';

import css from './ViewModeBar.module.css';

export type FaultViewMode = 'active' | 'overdue' | 'completed';

interface ViewModeBarProps {
  activeMode: FaultViewMode;
  onModeChange: (mode: FaultViewMode) => void;
}

const MODE_LABELS: Record<FaultViewMode, string> = {
  active: 'Attive',
  overdue: 'In ritardo',
  completed: 'Completate',
};

const MODE_HINTS: Record<FaultViewMode, string> = {
  active: 'Created / In progress / Suspended / Overdue',
  overdue: 'Solo segnalazioni in ritardo (Overdue)',
  completed: 'Storico delle segnalazioni completate',
};

const ViewModeBar = ({ activeMode, onModeChange }: ViewModeBarProps) => {
  return (
    <div className={css.bar} role="tablist" aria-label="Filtro stato">
      {(Object.keys(MODE_LABELS) as FaultViewMode[]).map(mode => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={activeMode === mode}
          title={MODE_HINTS[mode]}
          onClick={() => onModeChange(mode)}
          className={`${css.button} ${activeMode === mode ? css[`active_${mode}`] : ''}`}
        >
          {MODE_LABELS[mode]}
        </button>
      ))}
    </div>
  );
};

export default ViewModeBar;
