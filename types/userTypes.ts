export interface User {
  _id: String;
  role: UserRoles;
  fullName: String;
  email: String;
  avatar: String;
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

export type UserStatus = 'active' | 'inactive' | 'deactivated';
