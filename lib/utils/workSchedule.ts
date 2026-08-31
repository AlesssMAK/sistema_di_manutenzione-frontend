import type {
  PublicSystemSettings,
  WeekDayKey,
  WorkScheduleOverrideBase,
} from '@/lib/api/systemSettings';

export interface WorkWindow {
  enabled: boolean;
  start: string; // 'HH:mm'
  end: string; // 'HH:mm'
}

// Date.getDay() → weekday key (0 = Sunday).
const DAY_KEYS: WeekDayKey[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

const DEFAULT_WINDOW: WorkWindow = {
  enabled: true,
  start: '08:00',
  end: '17:00',
};

const windowFromOverride = (
  ov: WorkScheduleOverrideBase | undefined,
  dayKey: WeekDayKey
): WorkWindow | null => {
  if (!ov) return null;
  if (ov.perDay) {
    const d = ov.weekSchedule?.[dayKey];
    if (!d) return null;
    return { enabled: d.enabled, start: d.start, end: d.end };
  }
  if (!ov.workHours) return null;
  return { enabled: true, start: ov.workHours.start, end: ov.workHours.end };
};

const factoryWindow = (
  settings: PublicSystemSettings,
  dayKey: WeekDayKey
): WorkWindow => {
  const d = settings.weekSchedule?.[dayKey];
  if (d) return { enabled: d.enabled, start: d.start, end: d.end };
  return {
    enabled: true,
    start: settings.workHours?.start ?? DEFAULT_WINDOW.start,
    end: settings.workHours?.end ?? DEFAULT_WINDOW.end,
  };
};

// Resolve the working window for a target (a user and/or their role) on a
// given date, with precedence user override → role override → factory.
// Used to constrain scheduling slots to real working hours.
export const resolveWorkWindow = (
  settings: PublicSystemSettings | undefined,
  target: { userId?: string; role?: string },
  date?: Date | string | null
): WorkWindow => {
  if (!settings) return DEFAULT_WINDOW;
  const d = date ? new Date(date) : new Date();
  const dayKey = DAY_KEYS[Number.isNaN(d.getTime()) ? new Date().getDay() : d.getDay()];

  const overrides = settings.workScheduleOverrides;
  const userOv = target.userId
    ? overrides?.users?.find(u => u.userId === target.userId)
    : undefined;
  const roleOv = target.role
    ? overrides?.roles?.find(r => r.role === target.role)
    : undefined;

  return (
    windowFromOverride(userOv, dayKey) ??
    windowFromOverride(roleOv, dayKey) ??
    factoryWindow(settings, dayKey)
  );
};

// 'HH:mm' strings are zero-padded, so lexical compare == chronological.
const laterTime = (a: string, b: string) => (a > b ? a : b);
const earlierTime = (a: string, b: string) => (a < b ? a : b);

const dayKeyOf = (date?: Date | string | null): WeekDayKey => {
  const d = date ? new Date(date) : new Date();
  return DAY_KEYS[Number.isNaN(d.getTime()) ? new Date().getDay() : d.getDay()];
};

// The window a target can actually be scheduled into: their resolved window
// (user → role → factory) intersected with the factory's own opening hours,
// since nobody works while the plant is closed. A role/user override only
// narrows the hours — it can never extend past when the factory shuts. Used
// to bound the planning time slots.
export const resolveEffectiveWindow = (
  settings: PublicSystemSettings | undefined,
  target: { userId?: string; role?: string },
  date?: Date | string | null
): WorkWindow => {
  const own = resolveWorkWindow(settings, target, date);
  if (!settings) return own;
  const factory = factoryWindow(settings, dayKeyOf(date));
  return {
    enabled: own.enabled && factory.enabled,
    start: laterTime(own.start, factory.start),
    end: earlierTime(own.end, factory.end),
  };
};

const pad2 = (n: number) => String(n).padStart(2, '0');

// Local 'yyyy-MM-dd' (no timezone shift) for comparing against the
// configured holiday list.
const toLocalDateKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// Whether the factory (respecting a role/user override) actually works on
// the given calendar date. A date is non-working when its resolved window
// is disabled (e.g. a weekend the factory is closed) or it falls on a
// configured holiday. Used to block non-working days in planning pickers.
export const isWorkingDate = (
  settings: PublicSystemSettings | undefined,
  target: { userId?: string; role?: string },
  date: Date
): boolean => {
  if (!settings || Number.isNaN(date.getTime())) return true;
  if (!resolveWorkWindow(settings, target, date).enabled) return false;
  const key = toLocalDateKey(date);
  return !(settings.holidays ?? []).some(h => String(h).slice(0, 10) === key);
};

// Minutes since midnight for an 'HH:mm' string (used to drive the slot
// picker's range).
export const hhmmToMinutes = (hhmm: string | undefined): number | null => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};
