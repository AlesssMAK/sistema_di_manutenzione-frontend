'use client';

import css from './Tabs.module.css';

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  /**
   * Optional per-tab counters. Only the entries present in this record are
   * rendered as little badges next to the tab label, so callers can show
   * counts only on the active tab if that's all the backend returns.
   */
  counts?: Partial<Record<T, number>>;
}

const Tabs = <T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  counts,
}: TabsProps<T>) => {
  return (
    <div className={css.tabsBar} role="tablist">
      {tabs.map(tab => {
        const isActive = activeTab === tab.value;
        const count = counts?.[tab.value];
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.value)}
            className={`${css.tabButton} ${isActive ? css.tabActive : ''}`}
          >
            {tab.label}
            {count !== undefined && (
              <span className={css.tabCount}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
