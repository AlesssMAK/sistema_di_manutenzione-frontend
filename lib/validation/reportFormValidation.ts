import * as yup from 'yup';

export const reportSchema = yup.object({
  faultId: yup.string().trim().required('Fault ID is required'),
  dataCreated: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .required('Date is required'),
  timeCreated: yup
    .string()
    .matches(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)')
    .required('Time is required'),
  plantId: yup.string().required('Plant is required'),
  partId: yup.string().required('Part of plant is required'),
  typeFault: yup
    .string()
    .oneOf(['Production', 'Safety'])
    .required('Fault type is required'),
  comment: yup.string().trim().min(5).required('Comment is required'),
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
