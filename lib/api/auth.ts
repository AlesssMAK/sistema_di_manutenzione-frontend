import { LoginFormData } from '@/lib/validation/loginValidation';
import { CheckSessionRequest, RegisterRequest } from '@/types/authType';
import nextServer from './api';

export const register = async (data: RegisterRequest) => {
  const res = await nextServer.post('/auth/register', data);
  return res.data;
};

export const login = async (data: LoginFormData) => {
  const res = await nextServer.post('/auth/login', data);
  return res.data;
};

export const logout = async (): Promise<void> => {
  await nextServer.post('/auth/logout');
};

export const checkSession = async (): Promise<boolean> => {
  await nextServer.post<CheckSessionRequest>('/auth/refresh');
  return true;
};
