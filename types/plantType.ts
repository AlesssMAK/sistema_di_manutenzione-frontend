export interface Plant {
  _id: string;
  namePlant: string;
  code: string;
  location: string;
  description?: string;
}

export interface PlantPagination {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PlantsData {
  plants: Plant[];
  pagination: PlantPagination;
}

export interface PlantRespons {
  success: boolean;
  message: string;
  data: PlantsData;
}
