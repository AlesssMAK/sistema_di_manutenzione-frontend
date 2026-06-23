import type { UserRoles } from './userTypes';

// Mirrors backend constants/auditLog.js. Kept as a literal union so
// the FE filter dropdowns stay typed without an extra mapping step.
export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.refresh'
  | 'auth.register'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.verify'
  | 'plant.create'
  | 'plant.update'
  | 'plant.delete'
  | 'part.create'
  | 'part.update'
  | 'part.delete'
  | 'fault.create'
  | 'fault.update'
  | 'fault.delete'
  | 'fault.statusChange'
  | 'fault.assign'
  | 'fault.reassign'
  | 'fault.verify'
  | 'fault.auto_overdue'
  | 'fault.auto_replanned'
  | 'comment.create'
  | 'comment.delete'
  | 'settings.update'
  | 'message.create'
  | 'message.broadcast'
  | 'message.reply'
  | 'message.delete'
  | 'cron.reschedule'
  | 'cron.markOverdue';

export type AuditTarget =
  | 'User'
  | 'Plant'
  | 'PartPlant'
  | 'Fault'
  | 'Comment'
  | 'SystemSettings'
  | 'Session'
  | 'Message';

export type AuditActorRole = UserRoles | 'system';

export interface AuditActor {
  _id: string;
  fullName?: string;
  // BE populate still has the legacy name/lastname projection;
  // tolerate either while it gets cleaned up.
  name?: string;
  lastname?: string;
  email?: string;
  role?: AuditActorRole;
}

export interface AuditLogEntry {
  _id: string;
  actorId: AuditActor | string | null;
  actorRole: AuditActorRole;
  action: AuditAction;
  targetType: AuditTarget | null;
  targetId: string | null;
  summary: string;
  meta: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export type AuditCategory = 'access' | 'changes';

export interface AuditLogListParams {
  page?: number;
  perPage?: number;
  action?: AuditAction;
  actorRole?: AuditActorRole;
  targetType?: AuditTarget;
  actorId?: string;
  targetId?: string;
  /** Section split — access (auth.*) vs changes (everything else). */
  category?: AuditCategory;
  /** Free-text actor-name search (matched against fullName on BE). */
  search?: string;
  from?: string; // ISO date
  to?: string; // ISO date
  sort?: 'createdAt' | '-createdAt';
}

export interface AuditLogListResponse {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  items: AuditLogEntry[];
}
