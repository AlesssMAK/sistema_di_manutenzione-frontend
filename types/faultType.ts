export type StatusFaultType =
  | 'Created'
  | 'In progress'
  | 'Completed'
  | 'Suspended';
export type PriorityFaultType = 'Low' | 'Medium' | 'High';
export type TypeFault = 'Production' | 'Safety';
export type FaultAction = 'created' | 'updated';

export interface FaultCard {
  id: string;
  faultId: string;

  plantId: {
    _id: string;
    namePlant: string;
    code: string;
  };
  partId: {
    namePlantPart: string;
    codePlantPart: string;
  };
  nameOperator: string;
  userId: string;

  statusfault: StatusFaultType;
  comment: string;
  priority: PriorityFaultType;
  deadline?: string;
  plannedDate?: string;
  plannedTime?: string;
  estimatedDuration?: number;
  img?: string;
  managerComment?: string;
}

export interface FaultCardsQueryParams {
  page?: number;
  limit?: number;
}

export interface Fault {
  _id: string;
  faultId: string;
  nameOperator: string;
  userId: string;
  dataCreated: string;
  timeCreated: string;
  plantId: string;
  partId: string;
  typefault: TypeFault;
  statusfault: StatusFaultType;
  comment: string;
  img?: string;
  priority: PriorityFaultType;
  assignedMaintainers: string[];
  managerComment?: string;
  deadline?: string;
  plannedDate?: string;
  plannedTime?: string;
  estimatedDuration: number;
  managerId?: string;
  commentMaintenanceWorker?: string;
  history: FaultHistory[];
}

export interface FaultHistory {
  action: FaultAction;
  userId?: string;
  userName?: string;
  changes?: Record<string, unknown>;
  timestamp: string;
}
