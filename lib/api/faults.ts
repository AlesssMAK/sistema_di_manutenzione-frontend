import { FaultCard } from '@/types/faultType';
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
