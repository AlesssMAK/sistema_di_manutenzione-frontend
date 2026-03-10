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

export interface userRoles {
  role: 'operator' | 'admin' | 'manager' | 'maintenanceWorker' | 'safety';
}
