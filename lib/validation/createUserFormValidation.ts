import * as yup from 'yup';

export const createUserSchema = yup.object({
  role: yup
    .string()
    .oneOf(['operator', 'admin', 'manager', 'maintenanceWorker', 'safety'])
    .required('role is required'),

  fullName: yup
    .string()
    .trim()
    .matches(
      /^[A-Za-zÀ-ÖØ-öø-ÿА-Яа-яІіЇїЄєҐґ'-]{2,}( [A-Za-zÀ-ÖØ-öø-ÿА-Яа-яІіЇїЄєҐґ'-]{2,})+$/,
      'Full name must contain at least two words and only letters'
    )
    .required('full name is required'),

  email: yup.string().email().required('email is required'),

  password: yup.string().when('role', {
    is: (role: string) => role !== 'operator',
    then: schema => schema.min(8).required('password is required'),
    otherwise: schema => schema.strip(),
  }),

  avatar: yup.string().default('').nullable(),

  personalCode: yup.string().when('role', {
    is: 'operator',
    then: schema =>
      schema
        .matches(/^[A-Z]{2}\d{5}$/, 'Invalid personal code format')
        .required('personal code is required'),
    otherwise: schema => schema.strip(),
  }),
});
