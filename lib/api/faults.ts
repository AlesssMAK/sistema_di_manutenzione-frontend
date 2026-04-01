import { Fault, FaultCard, ReportFormValues } from '@/types/faultType';
import nextServer from './api';

export interface FetchFaultCardsParams {
  items: FaultCard[];
  total: number;
}

export const fetchFaultCards = async ({
  page = 1,
  limit = 2,
}): Promise<FetchFaultCardsParams> => {
  const res = await nextServer.get('/faults');
  console.log('RESPONSE FROM SERVER:', res.data);
  return {
    items: res.data.fault || [],
    total: res.data.totalFault || 0,
  };
};

export const createFault = async (data: ReportFormValues) => {
  const formData = new FormData();

  formData.append('faultId', data.faultId);
  formData.append('dataCreated', data.dataCreated);
  formData.append('timeCreated', data.timeCreated);
  formData.append('plantId', data.plantId);
  formData.append('partId', data.partId);
  formData.append('typefault', data.typefault);
  formData.append('comment', data.comment);

  if (data.img instanceof File) {
    formData.append('img', data.img);
  } else {
    formData.append('img', '');
  }

  const res = await nextServer.post('/faults', formData);

  return res.data;
};
