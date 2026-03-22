export type StatusFaultType = 'Creato' | 'In corso' | 'Completato' | 'Sospeso';
export type PriorityFaultType = 'Bassa' | 'Media' | 'Alta';
export interface FaultCard {
  id: string;
  faultId: string;

  plantId: {
    _id: string;
    namePlant: string;
    code: string;
  };
  partId: {
    namePartPlant: string;
    codePartPlant: string;
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
