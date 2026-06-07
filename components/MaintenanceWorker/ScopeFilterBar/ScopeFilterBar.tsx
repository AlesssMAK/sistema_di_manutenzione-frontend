'use client';

import css from './ScopeFilterBar.module.css';

export type FaultScope = 'mine' | 'pool' | 'all';

interface ScopeFilterBarProps {
  activeScope: FaultScope;
  onScopeChange: (scope: FaultScope) => void;
  disabled?: boolean;
}

const SCOPE_LABELS: Record<FaultScope, string> = {
  mine: 'Mie',
  pool: 'Libere',
  all: 'Tutte',
};

const SCOPE_HINTS: Record<FaultScope, string> = {
  mine: 'Solo interventi assegnati a me',
  pool: 'Interventi non assegnati (pool)',
  all: 'Tutti gli interventi',
};

const ScopeFilterBar = ({
  activeScope,
  onScopeChange,
  disabled = false,
}: ScopeFilterBarProps) => {
  return (
    <div className={css.bar} role="tablist" aria-label="Ambito segnalazioni">
      {(Object.keys(SCOPE_LABELS) as FaultScope[]).map(scope => (
        <button
          key={scope}
          type="button"
          role="tab"
          aria-selected={activeScope === scope}
          title={SCOPE_HINTS[scope]}
          onClick={() => onScopeChange(scope)}
          disabled={disabled}
          className={`${css.button} ${activeScope === scope ? css.active : ''}`}
        >
          {SCOPE_LABELS[scope]}
        </button>
      ))}
    </div>
  );
};

export default ScopeFilterBar;
