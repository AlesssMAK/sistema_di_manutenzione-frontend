// Which of a fault's dates put it inside the active "Periodo" filter.
// The filter is server-side (any-date $or); this recomputes the match on
// the client so the card can highlight the specific date that matched.

export interface Period {
  from: string; // 'YYYY-MM-DD' or ''
  to: string; // 'YYYY-MM-DD' or ''
}

// Normalize a date-ish value ('YYYY-MM-DD' string, or an ISO/Date for the
// Date-backed columns) to a 'YYYY-MM-DD' key for lexical comparison.
const toDayKey = (value?: string | Date | null): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  // Already 'YYYY-MM-DD', or an ISO string with a time part — take the day.
  return String(value).slice(0, 10);
};

/** True when `value`'s day falls within [period.from, period.to] (either
 *  bound optional). Returns false for an empty value or an inactive period. */
export const isInPeriod = (
  value: string | Date | null | undefined,
  period?: Period | null
): boolean => {
  if (!period || (!period.from && !period.to)) return false;
  const day = toDayKey(value);
  if (!day) return false;
  if (period.from && day < period.from) return false;
  if (period.to && day > period.to) return false;
  return true;
};
