import { STATUS } from '@/constants/status';
import { PlantPart } from './partPlant';

export interface Plant {
  _id: string;
  namePlant: string;
  code: string;
  location: string;
  description?: string;
  status: STATUS;
}

export interface PlantsPagination {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PlantsData {
  plants: Plant[];
  pagination: PlantsPagination;
}

export interface PlantsRequest {
  search?: string;
  status?: STATUS;
  page?: number;
  perPage?: number;
}

export interface PlantsRespons {
  success: boolean;
  message: string;
  data: PlantsData;
}

export interface CreatePlantRequest {
  namePlant: string;
  code: string;
  location: string;
  description?: string;
}

export interface UpdatePlant {
  namePlant?: string;
  code?: string;
  location?: string;
  description?: string;
  status?: STATUS;
}

export interface UpdatePlantRequest {
  plantId: string;
  data: UpdatePlant;
}

export interface CreateAndUpdatePlantResponse {
  success: boolean;
  message: string;
  data: Plant;
}
