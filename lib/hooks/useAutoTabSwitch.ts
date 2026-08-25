import { useEffect, useRef } from 'react';

interface UseAutoTabSwitchParams<T extends string> {
  /** The currently selected tab. */
  activeTab: T;
  /** Tab values in display order — the fallback target is the first of
   *  these that has results. */
  order: readonly T[];
  /** Per-tab result totals for the CURRENT filter. */
  counts: Partial<Record<T, number>>;
  /** True once every per-tab count is known (all count queries settled).
   *  While false the hook does nothing, so loading never triggers a jump. */
  ready: boolean;
  /** Called to move to another tab. */
  onSwitch: (tab: T) => void;
}

// Keeps the user on a tab that actually has results for the active
// filter. When the current tab is empty but another tab has matches,
// it switches to the first (in `order`) non-empty tab. If the current
// tab has results — including the case where every tab does — it stays
// put; if nothing matches anywhere, it also stays. Meant for Tabs that
// partition ONE filtered dataset (e.g. faults by status).
export function useAutoTabSwitch<T extends string>({
  activeTab,
  order,
  counts,
  ready,
  onSwitch,
}: UseAutoTabSwitchParams<T>) {
  // Keep the volatile inputs in a ref, synced in its own effect so they
  // aren't effect deps and the ref is never written during render.
  // `activeTab` lives here too on purpose: the switch must react to the
  // FILTER changing, not to the user manually picking a tab — so it must
  // NOT be an effect dependency, or a manual click onto an empty tab
  // would be bounced away immediately.
  const latest = useRef({ order, counts, onSwitch, activeTab });
  useEffect(() => {
    latest.current = { order, counts, onSwitch, activeTab };
  });

  // A stable string that only changes when the actual counts change, so
  // the switch effect fires on filter/data changes, not every render and
  // not on a manual tab change (which leaves the counts untouched).
  const signature = ready
    ? order.map(tab => `${tab}:${counts[tab] ?? 'x'}`).join('|')
    : '';

  useEffect(() => {
    if (!ready) return;
    const { order, counts, onSwitch, activeTab } = latest.current;
    const current = counts[activeTab];
    // Unknown or non-empty current tab → stay.
    if (current === undefined || current > 0) return;
    const target = order.find(tab => (counts[tab] ?? 0) > 0);
    if (target && target !== activeTab) onSwitch(target);
  }, [ready, signature]);
}
