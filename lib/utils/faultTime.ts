import type { FaultCard } from '@/types/faultType';

/**
 * Minutes actually worked on a fault so far, excluding Suspended pauses.
 * Mirrors the backend accumulator: finished spans (`workedMs`) plus the
 * currently-running span since `workStartedAt`. Falls back to `claimedAt`
 * for faults claimed before work-time tracking existed.
 */
export const liveWorkedMinutes = (
  fault: Pick<
    FaultCard,
    'workedMs' | 'workStartedAt' | 'statusFault' | 'claimedAt'
  >
): number => {
  const base = fault.workedMs ?? 0;
  const start =
    fault.workStartedAt ??
    (fault.statusFault === 'In progress' ? fault.claimedAt : null);
  const running = start
    ? Math.max(0, Date.now() - new Date(start).getTime())
    : 0;
  return Math.max(0, Math.round((base + running) / 60000));
};

export interface DurationUnits {
  d: string;
  h: string;
  m: string;
}

/** Split a minutes total into days / hours / minutes. */
export const splitMinutes = (total: number | undefined | null) => {
  const t = Math.max(0, Math.round(total ?? 0));
  return {
    days: Math.floor(t / 1440),
    hours: Math.floor((t % 1440) / 60),
    minutes: t % 60,
  };
};

/** Compact human duration, e.g. "2 g 3 h 15 min"; only shows the units
 *  that are non-zero (always shows minutes when everything is zero). */
export const formatDuration = (
  total: number | undefined | null,
  u: DurationUnits
): string => {
  const { days, hours, minutes } = splitMinutes(total);
  const parts: string[] = [];
  if (days) parts.push(`${days} ${u.d}`);
  if (hours) parts.push(`${hours} ${u.h}`);
  if (minutes || parts.length === 0) parts.push(`${minutes} ${u.m}`);
  return parts.join(' ');
};
