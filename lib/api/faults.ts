import { Fault, FaultCard, ReportFormValues } from '@/types/faultType';
import nextServer from './api';

export interface FetchFaultCardsParams {
  fault: FaultCard[];
  totalFault: number;
  totalPage: number;
  page: number;
  perPage: number;
}

export const fetchFaultCards = async ({
  page = 1,
  perPage = 2,
}): Promise<FetchFaultCardsParams> => {
  const res = await nextServer.get('/faults', {
    params: {
      page,
      perPage,
    },
  });

  return res.data;
};

export const createFault = async (data: ReportFormValues) => {
  const formData = new FormData();

  formData.append('faultId', data.faultId);
  formData.append('dataCreated', data.dataCreated);
  formData.append('timeCreated', data.timeCreated);
  formData.append('plantId', data.plantId);
  formData.append('partId', data.partId);
  formData.append('typeFault', data.typeFault);
  formData.append('comment', data.comment);

  if (data.img && data.img.length > 0) {
    data.img.forEach(file => {
      formData.append('img', file);
    });
  }

  const res = await nextServer.post('/faults', formData);

  return res.data;
};
