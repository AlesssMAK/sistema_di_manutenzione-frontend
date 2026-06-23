import nextServer from './api';

export interface WorkHours {
  start: string; // 'HH:mm'
  end: string; // 'HH:mm'
}

export interface PublicSystemSettings {
  _id: string;
  timezone: string;
  workHours: WorkHours;
  workDays: number[];
  slotDurationMinutes: number;
  holidays: string[];
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
  slotDurationMinutes: number;
  holidays: string[];
  email: Partial<EmailSettings>;
  messaging: Partial<MessagingSettings>;
  retention: Partial<RetentionSettings>;
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
