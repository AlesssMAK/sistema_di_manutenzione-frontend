import * as yup from 'yup';

export const reportSchema = yup.object({
  faultId: yup.string().trim().required(),
  dataCreated: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .required(),
  timeCreated: yup
    .string()
    .matches(/^\d{2}:\d{2}$/, 'Invalid time format')
    .required(),
  plantId: yup.string().required(),
  partId: yup.string().required(),
  typefault: yup.string().oneOf(['Production', 'Safety']).required(),
  comment: yup.string().trim().min(5).required(),
  img: yup
    .mixed<File>()
    .nullable()
    .notRequired()
    .default(null)
    .test('file-or-null', 'Invalid file', value => {
      return value === null || value instanceof File;
    }),
});
