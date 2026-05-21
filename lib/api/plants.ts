import {
  CreateAndUpdatePlantResponse,
  CreatePlantRequest,
  PlantsRequest,
  PlantsRespons,
} from '@/types/plantType';
import nextServer from './api';

export const getAllPlants = async ({
  search,
  status,
  page,
}: PlantsRequest = {}) => {
  const params = {
    search,
    status,
    page,
    perPage: 10,
  };
  const res = await nextServer.get<PlantsRespons>('/plants', { params });
  return res.data.data;
};

export const createPlant = async (data: CreatePlantRequest) => {
  const res = await nextServer.post<CreateAndUpdatePlantResponse>(
    '/plants',
    data
  );
  return res.data.data;
};

export const updatePlant = () => {};
