import { PlantRespons } from '@/types/plantType';
import nextServer from './api';

export const getAllPlants = async () => {
  const res = await nextServer.get<PlantRespons>('/plants');
  return res.data.data;
};
