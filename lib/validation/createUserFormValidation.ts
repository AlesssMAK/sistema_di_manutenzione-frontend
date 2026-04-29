import { USER_ROLES } from '@/constants/roleType';
import { USER_STATUS } from '@/constants/userStatus';
import { UserRoles, UserStatus } from '@/types/userTypes';
import * as yup from 'yup';

const fullNameRegex =
  /^[A-Za-zÀ-ÖØ-öø-ÿА-Яа-яІіЇїЄєҐґ'-]{2,}( [A-Za-zÀ-ÖØ-öø-ÿА-Яа-яІіЇїЄєҐґ'-]{2,})+$/;

const personalCodeRegex = /^[A-Z]{2}\d{5}$/;

export const createUserSchema = yup.object({
  role: yup.string().oneOf<UserRoles>(USER_ROLES).required('role is required'),

  fullName: yup
    .string()
    .trim()
    .matches(
      fullNameRegex,
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
        .matches(personalCodeRegex, 'Invalid personal code format')
        .required('personal code is required'),
    otherwise: schema => schema.strip(),
  }),
});

const emptyStringToUndefined = (value: unknown, originalValue: unknown) =>
  originalValue === '' ? undefined : value;

export const updateUserSchema = yup.object({
  role: yup.string().oneOf<UserRoles>(USER_ROLES).optional(),

  fullName: yup
    .string()
    .transform(emptyStringToUndefined)
    .trim()
    .matches(
      fullNameRegex,
      'Full name must contain at least two words and only letters'
    )
    .optional(),

  email: yup.string().transform(emptyStringToUndefined).email().optional(),

  password: yup
    .string()
    .transform(emptyStringToUndefined)
    .when(['role', '$originalRole'], {
      is: (role: string, originalRole: string) => {
        const finalRole = role ?? originalRole;
        return (
          finalRole !== 'operator' &&
          originalRole === 'operator' &&
          role &&
          role !== originalRole
        );
      },
      then: schema =>
        schema
          .min(8, 'password must be at least 8 characters')
          .required('Password is required when changing role from operator'),
      otherwise: schema =>
        schema.when('role', {
          is: (role: string) => role && role !== 'operator',
          then: s =>
            s.min(8, 'password must be at least 8 characters').optional(),
          otherwise: s => s.strip(),
        }),
    }),

  avatar: yup.string().nullable().optional(),
  status: yup.string().oneOf<UserStatus>(USER_STATUS).optional(),

  personalCode: yup
    .string()
    .transform(emptyStringToUndefined)
    .when(['role', '$originalRole'], {
      is: (role: string, originalRole: string) => {
        const finalRole = role ?? originalRole;
        return (
          finalRole === 'operator' &&
          originalRole !== 'operator' &&
          role &&
          role !== originalRole
        );
      },
      then: schema =>
        schema
          .matches(personalCodeRegex, 'Invalid personal code format')
          .required('Personal code is required when changing role to operator'),
      otherwise: schema =>
        schema.when('role', {
          is: 'operator',
          then: s =>
            s
              .matches(personalCodeRegex, 'Invalid personal code format')
              .optional(),
          otherwise: s => s.strip(),
        }),
    }),
});
