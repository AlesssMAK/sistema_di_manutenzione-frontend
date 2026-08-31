import { useEffect, useRef } from 'react';

interface Params<T extends string> {
  /** Changes whenever the filter that should re-trigger the jump changes
   *  (e.g. the "Periodo" range key). */
  triggerKey: string;
  /** Only jump while this is true (e.g. a period is actually selected). */
  active: boolean;
  activeTab: T;
  /** Tab values in display order — the target is the first non-empty one. */
  order: readonly T[];
  /** Per-tab result totals for the CURRENT filter. */
  counts: Partial<Record<T, number>>;
  /** True once every per-tab count has settled for the current filter. */
  ready: boolean;
  onSwitch: (tab: T) => void;
}

/**
 * Like useAutoTabSwitch, but re-fires every time `triggerKey` changes (not
 * one-shot). When a new filter is applied and its counts settle, if the
 * current tab is empty but another has matches, jump to the first non-empty
 * tab. Mount is skipped (landing is handled by useAutoTabSwitch), and only
 * a `triggerKey` change while `active` arms a jump — so it reacts to the
 * filter, never to a manual tab click.
 */
export function useAutoTabSwitchOnFilter<T extends string>({
  triggerKey,
  active,
  activeTab,
  order,
  counts,
  ready,
  onSwitch,
}: Params<T>) {
  // Volatile inputs kept in a ref so they aren't effect deps (a manual tab
  // click must not re-trigger the jump — only a filter change does).
  const latest = useRef({ order, counts, onSwitch, activeTab });
  useEffect(() => {
    latest.current = { order, counts, onSwitch, activeTab };
  });

  const prevTrigger = useRef(triggerKey);
  const mounted = useRef(false);
  // True once a filter change has armed a pending jump; consumed when the
  // counts for that filter settle. Refs (not state) so we never setState in
  // an effect.
  const armed = useRef(false);

  // A stable string that only changes when the actual counts change, so the
  // effect re-evaluates once counts settle (not on every render).
  const signature = ready
    ? order.map(tab => `${tab}:${counts[tab] ?? 'x'}`).join('|')
    : '';

  useEffect(() => {
    // Arm on a filter change (skip the very first render / mount).
    if (prevTrigger.current !== triggerKey) {
      prevTrigger.current = triggerKey;
      if (mounted.current && active) armed.current = true;
    }
    mounted.current = true;

    if (!armed.current || !ready) return;
    armed.current = false;
    const {
      order: ord,
      counts: cnt,
      onSwitch: sw,
      activeTab: cur,
    } = latest.current;
    const currentCount = cnt[cur];
    // Unknown or non-empty current tab → stay.
    if (currentCount === undefined || currentCount > 0) return;
    const target = ord.find(tab => (cnt[tab] ?? 0) > 0);
    if (target && target !== cur) sw(target);
  }, [triggerKey, active, ready, signature]);
}
