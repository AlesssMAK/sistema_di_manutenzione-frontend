import { getMeRespons, User } from '@/types/user';
import nextServer from './api';

export const getUsers = async () => {
  const { data } = await nextServer.get<User>('/users');
  return data;
};

export const getMe = async () => {
  const me = await nextServer.get<getMeRespons>('/users/me');
  return me.data.user;
};
