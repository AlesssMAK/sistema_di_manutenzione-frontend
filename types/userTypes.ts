import { STATUS } from '@/constants/status';

export interface UserPermissions {
  canCreateAnnouncements?: boolean;
  canSendMessages?: boolean;
}

/** Trimmed user shape returned by the "who is granted X" admin lists. */
export interface GrantedUser {
  _id: string;
  fullName: string;
  role: UserRoles;
}

export interface User {
  _id: string;
  role: UserRoles;
  fullName: string;
  email: string;
  avatar: string;
  status: STATUS;
  isFirstLogin: boolean;
  permissions?: UserPermissions;
}

export type UserRoles =
  | 'admin'
  | 'operator'
  | 'manager'
  | 'maintenanceWorker'
  | 'safety';

export interface GetMeRespons {
  success: boolean;
  user: User;
}

export interface UserRequest {
  search?: string;
  role?: UserRoles;
  status?: STATUS;
  page?: number;
  perPage?: number;
}

export interface UsersResponse {
  page: number;
  perPage: number;
  totalPages: number;
  totalUsers: number;
  users: User[];
}

export interface UpdateUserRequest {
  userId: string;
  data: UpdateUserValues;
}

export interface UpdateUserResponse {
  success: boolean;
  user: User;
}

export interface CreateUserValues {
  role: UserRoles;
  fullName: string;
  email: string;
  password: string | undefined;
  avatar: string | null;
  personalCode: string | undefined;
}

export interface UpdateUserValues {
  role?: UserRoles;
  fullName?: string;
  email?: string;
  status?: STATUS;
  password?: string | undefined;
  avatar?: string | null;
  personalCode?: string | undefined;
  permissions?: UserPermissions;
}
