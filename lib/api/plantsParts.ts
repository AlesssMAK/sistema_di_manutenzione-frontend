import {
  CreatePlantPartsRequest,
  PlantPart,
  PlantPartRespons,
  UpdatePlantPartRequest,
  UpdatePlantPartResponse,
} from '@/types/plantPartType';
import nextServer from './api';

export const getAllPartsByPlantId = async (
  plantId: string,
  params?: Record<string, unknown>
) => {
  const res = await nextServer.get<PlantPartRespons>(
    `/plants/${plantId}/parts`,
    { params }
  );
  return res.data.data;
};

export const createPlantParts = async (data: CreatePlantPartsRequest) => {
  const res = await nextServer.post<PlantPart[]>(`/plants/parts`, data);
  return res.data;
};

export const updatePlantParts = async ({
  plantId,
  plantPartId,
  data,
}: UpdatePlantPartRequest) => {
  const res = await nextServer.post<UpdatePlantPartResponse>(
    `/plants/${plantId}/parts/${plantPartId}`,
    data
  );
  return res.data;
};
