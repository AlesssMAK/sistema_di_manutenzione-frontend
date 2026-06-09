'use client';

import { useTranslations } from 'next-intl';
import css from './ScopeFilterBar.module.css';

export type FaultScope = 'mine' | 'pool' | 'all';

interface ScopeFilterBarProps {
  activeScope: FaultScope;
  onScopeChange: (scope: FaultScope) => void;
  disabled?: boolean;
}

const SCOPES: FaultScope[] = ['mine', 'pool', 'all'];

const SCOPE_HINT_KEY: Record<FaultScope, string> = {
  mine: 'mineHint',
  pool: 'poolHint',
  all: 'allHint',
};

const ScopeFilterBar = ({
  activeScope,
  onScopeChange,
  disabled = false,
}: ScopeFilterBarProps) => {
  const t = useTranslations('maintenanceWorkerPage.scope');

  return (
    <div className={css.bar} role="tablist" aria-label={t('ariaLabel')}>
      {SCOPES.map(scope => (
        <button
          key={scope}
          type="button"
          role="tab"
          aria-selected={activeScope === scope}
          title={t(SCOPE_HINT_KEY[scope])}
          onClick={() => onScopeChange(scope)}
          disabled={disabled}
          className={`${css.button} ${activeScope === scope ? css.active : ''}`}
        >
          {t(scope)}
        </button>
      ))}
    </div>
  );
};

export default ScopeFilterBar;
