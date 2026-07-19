import { User, UserRoles } from './userTypes';

export interface RegisterRequest {
  role: UserRoles;
  fullName: string;
  email: string;
  password: string | undefined;
  personalCode: string | undefined;
  avatar: string | null;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface LoginOperatorRequest {
  fullName: string;
  personalCode: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// The login form collapses both flows into one identifier/secret pair, so the
// payload sent to the API carries whichever combination was detected.
export interface LoginCredentials {
  email?: string;
  fullName?: string;
  password?: string;
  personalCode?: string;
}

export interface CheckSessionRequest {
  success: boolean;
}
