import nextServer from './api';
import type {
  AuditLogEntry,
  AuditLogListParams,
  AuditLogListResponse,
} from '@/types/auditLogType';

export const getAuditLogs = async (
  params: AuditLogListParams = {}
): Promise<AuditLogListResponse> => {
  const { data } = await nextServer.get<AuditLogListResponse>(
    '/admin/audit-log',
    { params }
  );
  return data;
};

export const getAuditLogById = async (
  id: string
): Promise<AuditLogEntry> => {
  const { data } = await nextServer.get<AuditLogEntry>(
    `/admin/audit-log/${id}`
  );
  return data;
};
