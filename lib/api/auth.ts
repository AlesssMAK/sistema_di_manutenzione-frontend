import { LoginFormData } from '@/lib/validation/loginValidation';
import {
  CheckSessionRequest,
  RegisterRequest,
  RegisterResponse,
} from '@/types/authType';
import nextServer from './api';

export const registerUser = async (data: RegisterRequest) => {
  const res = await nextServer.post<RegisterResponse>('/auth/register', data);
  return res.data.data;
};

export const login = async (data: LoginFormData) => {
  const res = await nextServer.post('/auth/login', data);
  return res.data;
};

export const logout = async (): Promise<void> => {
  await nextServer.post('/auth/logout');
};

export const checkSession = async (): Promise<boolean> => {
  await nextServer.post<CheckSessionRequest>('/auth/check');
  return true;
};
