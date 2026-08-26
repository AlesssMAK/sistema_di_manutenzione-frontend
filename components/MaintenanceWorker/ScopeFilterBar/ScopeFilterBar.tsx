'use client';

import { useTranslations } from 'next-intl';
import css from './ScopeFilterBar.module.css';

export type FaultScope = 'mine' | 'pool' | 'all';

interface ScopeFilterBarProps {
  activeScope: FaultScope;
  onScopeChange: (scope: FaultScope) => void;
  disabled?: boolean;
  /** Unseen-count badges per scope (only entries > 0 are shown). */
  counts?: Partial<Record<FaultScope, number>>;
  /** Which scopes to render. Defaults to all; the completed history
   *  drops 'pool' (free faults) since it has no meaning there. */
  scopes?: FaultScope[];
}

const ALL_SCOPES: FaultScope[] = ['mine', 'pool', 'all'];

const SCOPE_HINT_KEY: Record<FaultScope, string> = {
  mine: 'mineHint',
  pool: 'poolHint',
  all: 'allHint',
};

const ScopeFilterBar = ({
  activeScope,
  onScopeChange,
  disabled = false,
  counts,
  scopes = ALL_SCOPES,
}: ScopeFilterBarProps) => {
  const t = useTranslations('maintenanceWorkerPage.scope');

  return (
    <div className={css.bar} role="tablist" aria-label={t('ariaLabel')}>
      {scopes.map(scope => {
        const count = counts?.[scope];
        return (
          <button
            key={scope}
            type="button"
            role="tab"
            aria-selected={activeScope === scope}
            title={t(SCOPE_HINT_KEY[scope])}
            onClick={() => onScopeChange(scope)}
            disabled={disabled}
            className={`${css.button} ${
              activeScope === scope ? css.active : ''
            }`}
          >
            {t(scope)}
            {count ? <span className={css.badge}>{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
};

export default ScopeFilterBar;
