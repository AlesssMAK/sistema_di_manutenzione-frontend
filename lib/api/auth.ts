import { User, userRoles } from '@/types/user';
import nextServer from './api';

// ----------------------------------------------------Auth----------------------------------------------------//

export interface RegisterRequest {
  role: userRoles;
  fullName: String;
  email: String;
  password: String;
  personalCode: String;
}

export interface AuthResponse {
  user: User;
}

export const register = async (data: RegisterRequest) => {
  const res = await nextServer.post<AuthResponse>('/auth/register', data);
  return res.data;
};

interface LoginOperatorRequest {
  fullName: String;
  personalCode: String;
}
interface LoginRequest {
  email: String;
  password: String;
}

export const login = async (data: LoginOperatorRequest) => {
  const res = await nextServer.post('/auth/login', data);
  return res.data;
};

export const logout = async (): Promise<void> => {
  await nextServer.post('/auth/logout');
};

interface CheckSessionRequest {
  success: boolean;
}

export const checkSession = async (): Promise<boolean> => {
  await nextServer.post<CheckSessionRequest>('/auth/refresh');
  return true;
};

// ----------------------------------------------------Auth----------------------------------------------------//

// ----------------------------------------------------Users----------------------------------------------------//

export const getUsers = async () => {
  const { data } = await nextServer.get<User>('/users');
  return data;
};

interface getMeRespons {
  success: boolean;
  user: User;
}

export const getMe = async () => {
  const me = await nextServer.get<getMeRespons>('user/me');
  return me.data.user;
};

// ----------------------------------------------------Users----------------------------------------------------//
