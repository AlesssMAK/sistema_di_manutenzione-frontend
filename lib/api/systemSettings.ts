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

export const fetchSystemSettings = async (): Promise<PublicSystemSettings> => {
  const { data } = await nextServer.get<PublicSystemSettings>('/system-settings');
  return data;
};
