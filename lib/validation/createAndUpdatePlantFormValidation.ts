import * as yup from 'yup';

export const createPlantSchema = yup.object({
  namePlant: yup.string().trim().required('Name plant is required'),
  code: yup.string().trim().required('Code is required'),
  location: yup.string().trim().required('Location is required'),
  description: yup.string().trim().nullable().optional(),
});
