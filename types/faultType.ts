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
  statusfault: StatusFault;
  comment: string;
  img?: string;
  priority: TypePriority;
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

export enum TypePriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum TypeFault {
  PRODUCTION = 'Production',
  SAFETY = 'Safety',
}

export enum StatusFault {
  CREATED = 'Created',
  IN_PROGRESS = 'In progress',
  COMPLETED = 'Completed',
  SUSPENDED = 'Suspended',
}

export type FaultAction = 'created' | 'updated';

export interface FaultHistory {
  action: FaultAction;
  userId?: string;
  userName?: string;
  changes?: Record<string, unknown>;
  timestamp: string;
}
