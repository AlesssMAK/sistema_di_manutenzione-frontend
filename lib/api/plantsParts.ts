import {
  CreatePlantPartsRequest,
  PlantPart,
  PlantPartRespons,
} from '@/types/partPlant';
import nextServer from './api';

export const getAllPartsByPlantId = async (plantId: string) => {
  const res = await nextServer.get<PlantPartRespons>(
    `/plants/${plantId}/parts`
  );
  return res.data.data;
};

export const createPlantPart = async (data: CreatePlantPartsRequest) => {
  const res = await nextServer.post<PlantPart[]>(`/plants/parts`, data);
  return res.data;
};
