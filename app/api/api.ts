import axios, { AxiosError } from 'axios';

export type ApiError = AxiosError<{ message: string }>;
const baseURL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});
