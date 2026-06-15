import { PathString } from 'react-hook-form';

export type StatusFaultType =
  | 'Created'
  | 'In progress'
  | 'Completed'
  | 'Suspended'
  | 'Overdue';
export type PriorityFaultType = 'Low' | 'Medium' | 'High';
export type TypeFault = 'Production' | 'Safety';
export type FaultAction = 'created' | 'updated';

export interface MaintainerRef {
  _id: string;
  fullName: string;
  email?: string;
}

export type AssignedMaintainer = string | MaintainerRef;

export interface FaultCard {
  _id: string;
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

  statusFault: StatusFaultType;
  comment: string;
  priority: PriorityFaultType;
  deadline?: string;
  plannedDate?: string;
  plannedTime?: string;
  dataCreated?: string;
  timeCreated?: string;
  estimatedDuration?: number;
  assignedMaintainers: AssignedMaintainer[];
  typeFault: TypeFault;
  img?: [];
  managerComment?: string;
  commentMaintenanceWorker?: string;
  commentSafety?: string;
  actualDuration?: number;
  suspensionReason?: string;
  materialRequest?: string;
  completedAt?: string;
  claimedBy?: string;
  claimedAt?: string;
  autoRescheduledFrom?: {
    plannedDate?: string;
    plannedTime?: string;
    timestamp?: string;
  };
  updatedAt: string;
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
  typeFault: TypeFault;
  statusFault: StatusFaultType;
  comment: string;
  img?: string;
  priority: PriorityFaultType;
  assignedMaintainers: AssignedMaintainer[];
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

export interface ReportFormValues {
  faultId: string;
  dataCreated: string;
  timeCreated: string;
  plantId: string;
  partId: string;
  typeFault: TypeFault;
  comment: string;
  img: File[];
}

export interface NewFaultContent {
  plantId: string;
  partId: string;
  typeFault: TypeFault;
  comment: string;
}
