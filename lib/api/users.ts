import {
  GetMeRespons,
  UpdateUserRequest,
  UpdateUserResponse,
  User,
} from '@/types/userTypes';
import nextServer from './api';

export const getAllUsers = async () => {
  const { data } = await nextServer.get<User[]>('/users');
  return data;
};

export const getMe = async () => {
  const me = await nextServer.get<GetMeRespons>('/users/me');
  return me.data.user;
};

// export const updateUser = async ({ userId, data }: UpdateUserRequest) => {
//   const res = await nextServer.patch<UpdateUserResponse>(
//     `/users/${userId}`,
//     data
//   );
//   return res.data.user;
// };

export const updateUser = async ({ userId, data }: UpdateUserRequest) => {
  const res = await nextServer.put<UpdateUserResponse>(
    `/users/${userId}`,
    data
  );
  return res.data.user;
};
