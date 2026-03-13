import { userRoles } from './userTypes';

export interface RegisterRequest {
  role: userRoles;
  fullName: String;
  email: String;
  password: String;
  personalCode: String;
}

export interface LoginOperatorRequest {
  fullName: String;
  personalCode: String;
}

export interface LoginRequest {
  email: String;
  password: String;
}

export interface CheckSessionRequest {
  success: boolean;
}
