import { FaultCard, ReportFormValues } from '@/types/faultType';
import nextServer from './api';

interface FetchParams {
  page?: number;
  perPage?: number;
  priority?: string;
  deadline?: string;
  dataCreated?: string;
  plannedDate?: string;
  statusFault?: string;
  typeFault?: string;
  assignedTo?: string;
  assignedToEmpty?: boolean;
  createdById?: string;
}
export interface FetchFaultCardsParams {
  fault: FaultCard[];
  totalFault: number;
  totalPage: number;
  page: number;
  perPage: number;
}

export const fetchFaultCards = async ({
  page,
  perPage,
  priority = '',
  deadline,
  dataCreated,
  plannedDate,
  statusFault,
  typeFault,
  assignedTo,
  assignedToEmpty,
  createdById,
}: FetchParams): Promise<FetchFaultCardsParams> => {
  const res = await nextServer.get('/faults', {
    params: {
      page,
      perPage,
      ...(priority ? { priority } : {}),
      deadline,
      ...(dataCreated ? { dataCreated } : {}),
      ...(plannedDate ? { plannedDate } : {}),
      ...(statusFault ? { statusFault } : {}),
      ...(typeFault ? { typeFault } : {}),
      ...(assignedTo ? { assignedTo } : {}),
      ...(assignedToEmpty ? { assignedToEmpty: 'true' } : {}),
      ...(createdById ? { createdById } : {}),
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

export const fetchFaultById = async (id: string): Promise<FaultCard> => {
  if (!id) {
    throw new Error('Fault ID is required');
  }

  const res = await nextServer.get<FaultCard>(`/faults/${id}`);

  return res.data;
};

export interface UpdateFaultPayload {
  faultId: string;
  statusFault: string;
  commentMaintenanceWorker?: string;
  actualDuration?: number;
  suspensionReason?: string;
  materialRequest?: string;
}

export const updateFaultByWorker = async (
  payload: UpdateFaultPayload
): Promise<FaultCard> => {
  if (!payload.faultId) {
    throw new Error('Fault ID is required');
  }

  const res = await nextServer.patch<FaultCard>(
    `/faults/${payload.faultId}`,
    payload
  );

  return res.data;
};

export const claimFault = async (faultId: string): Promise<FaultCard> => {
  if (!faultId) {
    throw new Error('Fault ID is required');
  }

  const res = await nextServer.patch<FaultCard>(
    `/maintenance-worker/fault/${faultId}/claim`
  );

  return res.data;
};