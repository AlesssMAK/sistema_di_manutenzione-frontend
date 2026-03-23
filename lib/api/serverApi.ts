import { cookies } from 'next/headers';
import axios from 'axios';
import nextServer from './api';
import { getMeRespons, User } from '@/types/userTypes';
import type { FaultCard } from '@/types/faultType';
import { FaultCardsQueryParams } from '@/types/faultType';

export interface FetchFaultCardsParams {
  items: FaultCard[];
  total: number;
}

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

export const fetchFaultCards = async ({
  page = 1,
  limit = 2,
}: FaultCardsQueryParams = {}): Promise<FetchFaultCardsParams> => {
  // const cookieStore = await cookies();
  // const allCookies = cookieStore.toString();
  const res = await nextServer.get('/fault', {
    params: { page, perPage: limit },
    // headers: { Cookie: cookieStore.toString() },
  });

  return {
    items: res.data.fault || [],
    total: res.data.totalFault || 0,
  };
};
