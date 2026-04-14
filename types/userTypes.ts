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

export interface UpdateUser {
  role?: string;
  fullName?: string;
  email?: string;
  password?: string;
  personalCode?: string;
  avatar?: string;
  status?: UserStatus;
}

export interface UpdateUserRequest {
  userId: string;
  data: UpdateUser;
}

export interface UpdateUserResponse {
  success: boolean;
  user: User;
}
