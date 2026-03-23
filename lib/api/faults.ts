import { Fault } from '@/types/faultType';
import nextServer from './api';

export const getAllFaults = async () => {
  const data = await nextServer.get<Fault>('/faults');
  console.log(data.data);
  return data.data;
};
