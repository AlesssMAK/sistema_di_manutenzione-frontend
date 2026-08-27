import nextServer from './api';

export interface WorkHours {
  start: string; // 'HH:mm'
  end: string; // 'HH:mm'
}

export interface DaySchedule {
  enabled: boolean;
  start: string; // 'HH:mm'
  end: string; // 'HH:mm'
}

export type WeekDayKey =
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'sat'
  | 'sun';

export type WeekSchedule = Record<WeekDayKey, DaySchedule>;

/** A work-hour override for a role or a user. `perDay` false → the
 *  single workHours range on every day; true → the per-day weekSchedule.
 *  Both are optional so an entry only carries what it uses. */
export interface WorkScheduleOverrideBase {
  perDay?: boolean;
  workHours?: WorkHours;
  weekSchedule?: WeekSchedule;
}
export interface RoleWorkSchedule extends WorkScheduleOverrideBase {
  role: string;
}
export interface UserWorkSchedule extends WorkScheduleOverrideBase {
  userId: string;
}
export interface WorkScheduleOverrides {
  roles: RoleWorkSchedule[];
  users: UserWorkSchedule[];
}

export interface BachecaSettings {
  // When true the Segnalazioni tab shows all faults (paginated);
  // otherwise only those created within recentFaultsDays.
  showAllFaults: boolean;
  recentFaultsDays: number;
}

export interface MaintenanceSettings {
  /** Hours past the planned duration before the technician is alerted. */
  overtimeAlertHours: number;
}

export interface WarehouseLowStockSettings {
  notify: boolean;
  /** Specific users that receive the low-stock push alert. */
  userIds: string[];
}

export interface WarehouseLabelSettings {
  /** Printable label formats available to technicians. */
  qr: boolean;
  barcode: boolean;
}

export interface FaultWarehousesForRole {
  role: string;
  warehouseIds: string[];
}

export interface WarehouseSettings {
  /** Global on/off for the whole inventory module. */
  enabled: boolean;
  /** Multi-warehouse mode. Off = single warehouse, pickers hidden. */
  multiWarehouse?: boolean;
  /** Effective warehouse used when a context has no explicit choice. */
  defaultWarehouseId?: string | null;
  /** Per-role warehouses usable when working on a fault (maintenance context). */
  faultWarehousesByRole?: FaultWarehousesForRole[];
  lowStock?: WarehouseLowStockSettings;
  labels?: WarehouseLabelSettings;
}

export interface PublicSystemSettings {
  _id: string;
  timezone: string;
  workHours: WorkHours;
  workDays: number[];
  weekSchedule: WeekSchedule;
  slotDurationMinutes: number;
  holidays: string[];
  workScheduleOverrides?: WorkScheduleOverrides;
  bacheca?: BachecaSettings;
  maintenance?: MaintenanceSettings;
  warehouse?: WarehouseSettings;
  updatedAt?: string;
}

export interface EmailTriggers {
  onAssignment: boolean;
  onNewFault: boolean;
  onSicurezzaHse: boolean;
  onDirectMessage: boolean;
  onSuspended: boolean;
  onReassign: boolean;
}

export interface EmailSettings {
  enabled: boolean;
  from: string;
  triggers: EmailTriggers;
  rateLimits: { perRecipientPerHour: number };
}

export interface MessagingSettings {
  broadcastTtlDays: number;
  directRateLimitPerHour: number;
}

export interface RetentionSettings {
  auditLogDays: number;
  completedFaultsArchiveMonths: number | null;
}

/** Full settings document — admin-only (GET /system-settings/full). */
export interface FullSystemSettings extends PublicSystemSettings {
  email: EmailSettings;
  messaging: MessagingSettings;
  retention: RetentionSettings;
}

/** PATCH accepts any subset of the editable sections. */
export type UpdateSystemSettingsPayload = Partial<{
  timezone: string;
  workHours: WorkHours;
  workDays: number[];
  weekSchedule: WeekSchedule;
  slotDurationMinutes: number;
  holidays: string[];
  workScheduleOverrides: WorkScheduleOverrides;
  email: Partial<EmailSettings>;
  messaging: Partial<MessagingSettings>;
  retention: Partial<RetentionSettings>;
  bacheca: Partial<BachecaSettings>;
  maintenance: Partial<MaintenanceSettings>;
  warehouse: Partial<WarehouseSettings>;
}>;

export const fetchSystemSettings = async (): Promise<PublicSystemSettings> => {
  const { data } = await nextServer.get<PublicSystemSettings>('/system-settings');
  return data;
};

export const fetchFullSystemSettings =
  async (): Promise<FullSystemSettings> => {
    const { data } = await nextServer.get<FullSystemSettings>(
      '/system-settings/full'
    );
    return data;
  };

export const updateSystemSettings = async (
  payload: UpdateSystemSettingsPayload
): Promise<FullSystemSettings> => {
  const { data } = await nextServer.patch<FullSystemSettings>(
    '/system-settings',
    payload
  );
  return data;
};
