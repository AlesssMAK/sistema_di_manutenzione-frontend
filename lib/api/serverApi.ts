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

// Validate an access token against the backend instead of trusting the
// cookie's mere presence. `/users/me` runs the backend `authenticate`
// middleware, so a stale/killed session returns 401 and we report the
// token as invalid rather than letting it masquerade as a live session.
export const validateServerSession = async (): Promise<boolean> => {
  const cookieStore = await cookies();

  try {
    await nextServer.get('/users/me', {
      headers: { Cookie: cookieStore.toString() },
    });
    return true;
  } catch {
    return false;
  }
};

export const getServerMe = async (): Promise<User> => {
  const cookieStore = await cookies();

  const { data } = await nextServer.get<GetMeRespons>('/users/me', {
    headers: { Cookie: cookieStore.toString() },
  });

  return data.user;
};
