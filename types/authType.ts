import { UserRoles } from './userTypes';

export interface RegisterRequest {
  role: UserRoles;
  fullName: string;
  email: string;
  password: string | undefined;
  personalCode: string | undefined;
  avatar: string | null;
}

export interface LoginOperatorRequest {
  fullName: string;
  personalCode: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CheckSessionRequest {
  success: boolean;
}
