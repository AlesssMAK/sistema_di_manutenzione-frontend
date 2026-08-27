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

// Minutes since midnight for an 'HH:mm' string (used to drive the slot
// picker's range).
export const hhmmToMinutes = (hhmm: string | undefined): number | null => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};
