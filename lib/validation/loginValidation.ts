import * as yup from 'yup';

export const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isFullName = (value: string) =>
  /^[A-Za-zÀ-ÖØ-öø-ÿ'’\-]+\s+[A-Za-zÀ-ÖØ-öø-ÿ'’\-]+$/.test(value.trim());

export const isPassword = (value: string) => value.length >= 8;

export const isPersonalCode = (value: string) => /^[A-Z]{2}\d{5}$/.test(value);

export const createLoginSchema = (t: any) =>
  yup.object({
    identifier: yup
      .string()
      .required(t('errors.required'))
      .test('identifier-type', t('errors.invalidIdentifier'), value => {
        if (!value) return false;
        return isEmail(value) || isFullName(value);
      }),

    secret: yup
      .string()
      .required(t('errors.required'))
      .test('secret-type', t('errors.invalidSecret'), value => {
        if (!value) return false;
        return isPassword(value) || isPersonalCode(value);
      }),
  });

export type LoginFormData = yup.InferType<ReturnType<typeof createLoginSchema>>;
