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

// Picks a sensible LANDING tab: on the first render where every count is
// known, if the initial tab is empty but another has matches, it switches
// once to the first (in `order`) non-empty tab. It runs a single time and
// then never again — after landing, the user is free to open any tab,
// including empty ones, without being bounced away. Meant for Tabs that
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
  // the switch effect re-evaluates once counts settle (not every render).
  const signature = ready
    ? order.map(tab => `${tab}:${counts[tab] ?? 'x'}`).join('|')
    : '';

  // One-shot: the landing switch happens the first time counts are ready
  // and then is disabled forever. Without this, later count refetches
  // (e.g. mark-seen invalidations) would re-fire it and bounce the user
  // off an empty tab they deliberately opened.
  const didLandRef = useRef(false);

  useEffect(() => {
    if (!ready || didLandRef.current) return;
    didLandRef.current = true;
    const { order, counts, onSwitch, activeTab } = latest.current;
    const current = counts[activeTab];
    // Unknown or non-empty current tab → stay.
    if (current === undefined || current > 0) return;
    const target = order.find(tab => (counts[tab] ?? 0) > 0);
    if (target && target !== activeTab) onSwitch(target);
  }, [ready, signature]);
}
