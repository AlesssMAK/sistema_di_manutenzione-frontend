import {
  CreateAndUpdatePlantResponse,
  CreatePlantRequest,
  PlantsRequest,
  PlantsRespons,
  UpdatePlantRequest,
} from '@/types/plantType';
import nextServer from './api';

export const getAllPlants = async ({
  search,
  status,
  page,
  perPage,
}: PlantsRequest = {}) => {
  const params = {
    search,
    status,
    page,
    perPage,
  };
  const res = await nextServer.get<PlantsRespons>('/plants', { params });
  return res.data.data;
};

export const createPlant = async (data: CreatePlantRequest) => {
  const res = await nextServer.post<CreateAndUpdatePlantResponse>(
    '/plants',
    data
  );
  return res.data.plant;
};

export const updatePlant = async ({ plantId, data }: UpdatePlantRequest) => {
  const res = await nextServer.put<CreateAndUpdatePlantResponse>(
    `/plants/${plantId}`,
    data
  );
  return res.data.plant;
};

export const deletePlant = async (plantId: string) => {
  const res = await nextServer.delete(`/plants/${plantId}`);
  return res.data;
};
