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
  typeFault: yup.string().oneOf(['Production', 'Safety']).required(),
  comment: yup.string().trim().min(5).required(),
  img: yup
    .array()
    .max(5)
    .of(
      yup
        .mixed<File>()
        .required()
        .test('is-file', 'Invalid file', value => value instanceof File)
        .test('file-type', 'Unsupported file format', file =>
          file
            ? [
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/jpg',
                'image/bmp',
              ].includes(file.type)
            : true
        )
    )
    .default([]),
});
