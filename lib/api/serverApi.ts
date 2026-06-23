import { cookies } from 'next/headers';
import nextServer from './api';
import { GetMeRespons, User } from '@/types/userTypes';

export const checkServerSession = async () => {
  const cookieStore = await cookies();

  // axios.post(url, data, config) — cookies belong in the 3rd
  // argument. Passing { headers } as the 2nd sends them as the
  // request body, so the upstream never receives the Cookie header
  // and always replies 401.
  const res = await nextServer.post('/auth/refresh', null, {
    headers: { Cookie: cookieStore.toString() },
  });
  return res;
};

export const getServerMe = async (): Promise<User> => {
  const cookieStore = await cookies();

  const { data } = await nextServer.get<GetMeRespons>('/users/me', {
    headers: { Cookie: cookieStore.toString() },
  });

  return data.user;
};
