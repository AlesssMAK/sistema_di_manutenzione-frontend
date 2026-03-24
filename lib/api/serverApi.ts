import { cookies } from 'next/headers';
import axios from 'axios';
import nextServer from './api';
import { getMeRespons, User } from '@/types/userTypes';

export const checkServerSession = async () => {
  const cookieStore = await cookies();

  const res = await nextServer.post('/auth/refresh', {
    headers: {
      Cookie: cookieStore.toString(),
    },
  });
  return res;
};

export const getServerMe = async (): Promise<User> => {
  const cookieStore = await cookies();

  const { data } = await nextServer.get<getMeRespons>('/users/me', {
    headers: { Cookie: cookieStore.toString() },
  });

  return data.user;
};
