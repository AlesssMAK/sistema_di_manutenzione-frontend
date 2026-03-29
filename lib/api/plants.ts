import { PlantRespons } from '@/types/plantType';
import nextServer from './api';
import { PlantPartRespons } from '@/types/partPlant';

export const getAllPlants = async () => {
  const res = await nextServer.get<PlantRespons>('/plants');
  return res.data.data;
};

export const getAllPartsByPlantId = async (plantId: string) => {
  const res = await nextServer.get<PlantPartRespons>(
    `/plants/${plantId}/parts`
  );

  return res.data.data;
};
