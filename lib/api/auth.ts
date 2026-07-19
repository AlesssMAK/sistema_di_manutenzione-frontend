import {
  CheckSessionRequest,
  LoginCredentials,
  RegisterRequest,
  RegisterResponse,
} from '@/types/authType';
import nextServer from './api';

export const registerUser = async (data: RegisterRequest) => {
  const res = await nextServer.post<RegisterResponse>('/auth/register', data);
  return res.data.data;
};

export const login = async (data: LoginCredentials) => {
  const res = await nextServer.post('/auth/login', data);
  return res.data;
};

export const logout = async (): Promise<void> => {
  await nextServer.post('/auth/logout');
};

export const forgotPassword = async (email: string) => {
  const res = await nextServer.post('/auth/forgot-password', { email });
  return res.data;
};

export const resetPassword = async (token: string, password: string) => {
  const res = await nextServer.post('/auth/reset-password', { token, password });
  return res.data;
};

export const checkSession = async (): Promise<boolean> => {
  // Returns a boolean instead of throwing so callers (AuthProvider)
  // can branch cleanly. A 401 here just means "no valid session".
  try {
    await nextServer.post<CheckSessionRequest>('/auth/check');
    return true;
  } catch {
    return false;
  }
};
