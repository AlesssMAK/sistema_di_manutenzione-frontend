import * as yup from 'yup';

export const createPlantPartsSchema = yup.object({
  plantId: yup.string().trim().required(),
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
