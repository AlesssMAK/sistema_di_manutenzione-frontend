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

interface LoginRequest {
  email: String;
  password: String;
}

export const login = async (data: LoginRequest) => {
  const res = await nextServer.post('/auth/login', data);
  return res;
};

export const logout = async (): Promise<void> => {
  await nextServer.post('/auth/logout');
};

// ----------------------------------------------------Auth----------------------------------------------------//

export const getUsers = async () => {
  const { data } = await nextServer.get<User>('/users');
  return data;
};
