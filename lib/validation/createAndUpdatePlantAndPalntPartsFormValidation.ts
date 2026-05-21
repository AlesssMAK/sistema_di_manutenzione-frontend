import { STATUS, STATUS_OPTIONS } from '@/constants/status';
import * as yup from 'yup';

export const createPlantAndPlantPartsSchema = yup.object({
  namePlant: yup.string().trim().required('Name plant is required'),
  code: yup.string().trim().required('Code is required'),
  location: yup.string().trim().required('Location is required'),
  description: yup.string().trim().optional().default(''),
  parts: yup
    .array()
    .of(
      yup.object({
        namePlantPart: yup
          .string()
          .trim()
          .required('Name plant part is required'),

        codePlantPart: yup
          .string()
          .trim()
          .required('Code plant part is required'),
      })
    )
    .min(1, 'Add at least one part')
    .required('The parts list is required'),
});

export type CreatePlantAndPlantPartsFormValues = yup.InferType<
  typeof createPlantAndPlantPartsSchema
>;

export const updatePlantSchema = yup.object({
  namePlant: yup.string().trim().optional(),
  code: yup.string().trim().optional(),
  location: yup.string().trim().optional(),
  description: yup.string().trim().optional(),
  status: yup.string().oneOf<STATUS>(STATUS_OPTIONS).optional(),
});

export const updatePlantPartSchema = yup.object({
  namePlantPart: yup.string().trim().optional(),
  codePlantPart: yup.string().trim().optional(),
  status: yup.string().oneOf<STATUS>(STATUS_OPTIONS).optional(),
});
