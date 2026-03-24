import { Fault } from '@/types/faultType';
import nextServer from './api';

export const getAllFaults = async () => {
  const res = await nextServer.get<Fault>('/faults');
  console.log(res.data);
  return res.data;
};

export const getFaultById = async (faultId: string) => {
  const res = await nextServer.get<Fault>(`/faults/${faultId}`);
  return res.data;
};
