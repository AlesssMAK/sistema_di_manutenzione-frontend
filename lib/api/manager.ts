import nextServer from './api';
import type { FaultCard, PriorityFaultType, TypeFault } from '@/types/faultType';

export interface AssignFaultPayload {
  faultId: string;
  priority: PriorityFaultType;
  assignedMaintainers: string[];
  plannedDate: string;
  plannedTime: string;
  estimatedDuration: number;
  deadline: string;
  managerComment?: string;
  typeFault: TypeFault;
}

export const assignFault = async (
  payload: AssignFaultPayload
): Promise<FaultCard> => {
  const { data } = await nextServer.post<FaultCard>('/manager/fault', payload);
  return data;
};

export const reassignFault = async (
  faultId: string,
  assignedMaintainers: string[]
): Promise<FaultCard> => {
  const { data } = await nextServer.patch<FaultCard>(
    `/manager/fault/${faultId}/reassign`,
    { assignedMaintainers }
  );
  return data;
};

export const addMaintainers = async (
  faultId: string,
  additionalMaintainers: string[]
): Promise<FaultCard> => {
  const { data } = await nextServer.post<FaultCard>(
    `/manager/fault/${faultId}/add-maintainers`,
    { additionalMaintainers }
  );
  return data;
};

export interface MaintenanceWorkerOption {
  _id: string;
  fullName: string;
}

interface MaintenanceWorkersResponse {
  status: string;
  results: number;
  data: MaintenanceWorkerOption[];
}

export const getMaintenanceWorkers = async (): Promise<
  MaintenanceWorkerOption[]
> => {
  const { data } = await nextServer.get<MaintenanceWorkersResponse>(
    '/maintenance-worker'
  );
  return data.data;
};
