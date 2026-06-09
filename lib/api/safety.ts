import nextServer from './api';
import type { FaultCard } from '@/types/faultType';

export const updateSafetyComment = async (
  faultId: string,
  commentSafety: string
): Promise<FaultCard> => {
  if (!faultId) throw new Error('Fault ID is required');
  const res = await nextServer.patch<FaultCard>(
    `/safety/fault/${faultId}`,
    { commentSafety }
  );
  return res.data;
};
