import {
  GetMeRespons,
  UpdateUserRequest,
  UpdateUserResponse,
  User,
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

export const updateUser = async ({ userId, data }: UpdateUserRequest) => {
  const res = await nextServer.put<UpdateUserResponse>(
    `/users/${userId}`,
    data
  );
  return res.data.user;
};
