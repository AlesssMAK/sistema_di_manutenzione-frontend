export interface PlantPart {
  _id: string;
  plantId: string;
  namePlantPart: string;
  codePlantPart: string;
}

export interface PlantPartsPagination {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PlantPartsData {
  plantParts: PlantPart[];
  pagination: PlantPartsPagination;
}

export interface PlantPartRespons {
  success: boolean;
  message: string;
  data: PlantPartsData;
}
