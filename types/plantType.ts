import { STATUS } from '@/constants/status';

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

export interface CreatePlant {
  namePlant: string;
  code: string;
  location: string;
  description?: string;
  status: STATUS;
}

export interface CreatePlantRequest {
  data: CreatePlant;
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
  plant: Plant;
}
