import {
  CreatePlantPartsRequest,
  DeletePlantPartRequest,
  DeletePlantPartResponse,
  PlantPart,
  PlantPartRespons,
  PlantPartsRequest,
  UpdatePlantPartRequest,
  UpdatePlantPartResponse,
} from '@/types/plantPartType';
import nextServer from './api';

export const getAllPartsByPlantId = async ({
  plantId,
  search,
  status,
  page,
  perPage,
}: PlantPartsRequest) => {
  const params = {
    search,
    status,
    page,
    perPage,
  };
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
  const res = await nextServer.put<UpdatePlantPartResponse>(
    `/plants/${plantId}/parts/${plantPartId}`,
    data
  );
  return res.data;
};

export const deletePlantPart = async ({
  plantId,
  plantPartId,
}: DeletePlantPartRequest) => {
  const res = await nextServer.delete<DeletePlantPartResponse>(
    `/plants/${plantId}/parts/${plantPartId}`
  );
  return res.data.success;
};
