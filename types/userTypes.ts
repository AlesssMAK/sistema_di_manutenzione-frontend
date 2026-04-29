export interface User {
  _id: string;
  role: UserRoles;
  fullName: string;
  email: string;
  avatar: string;
  status: UserStatus;
  isFirstLogin: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export type UserStatus = 'active' | 'deactivated';

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
  status?: UserStatus;
  password?: string | undefined;
  avatar?: string | null;
  personalCode?: string | undefined;
}
