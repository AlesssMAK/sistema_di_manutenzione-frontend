export interface User {
  _id: String;
  role: userRoles;
  fullName: String;
  email: String;
  avatar: String;
  status: String;
  isFirstLogin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type userRoles =
  | 'operator'
  | 'admin'
  | 'manager'
  | 'maintenanceWorker'
  | 'safety';

export interface getMeRespons {
  success: boolean;
  user: User;
}
