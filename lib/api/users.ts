import {
  GetMeRespons,
  UpdateUserRequest,
  UpdateUserResponse,
  UserRequest,
  UsersResponse,
} from '@/types/userTypes';
import nextServer from './api';

export const getAllUsers = async ({
  search,
  role,
  status,
  page,
  perPage,
}: UserRequest) => {
  const params = {
    search,
    role,
    status,
    page,
    perPage: perPage ?? 10,
  };
  const { data } = await nextServer.get<UsersResponse>('/users', { params });
  return data;
};

export const getMe = async () => {
  const me = await nextServer.get<GetMeRespons>('/users/me');
  return me.data.user;
};

// Mirror the chosen UI language onto the profile (drives localized emails).
export const setMyLocale = async (locale: string) => {
  await nextServer.patch('/users/me/locale', { locale });
};

export const updateUser = async ({ userId, data }: UpdateUserRequest) => {
  const res = await nextServer.put<UpdateUserResponse>(
    `/users/${userId}`,
    data
  );
  return res.data.user;
};
