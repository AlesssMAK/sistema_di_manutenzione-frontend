import { PlantPartRespons } from '@/types/partPlant';
import nextServer from './api';

export const getAllPartsByPlantId = async (plantId: string) => {
  const res = await nextServer.get<PlantPartRespons>(
    `/plants/${plantId}/parts`
  );
  return res.data.data;
};

export const createPlantPart = () => {};
