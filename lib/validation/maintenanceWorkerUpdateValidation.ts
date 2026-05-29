import * as yup from 'yup';

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'In progress': ['Completed', 'Suspended'],
  Suspended: ['In progress', 'Completed'],
  Overdue: ['Completed'],
  Created: [],
  Completed: [],
};

export const maintainerUpdateSchema = yup.object({
  // statusFault enum validation happens on the backend (Joi). Here we keep
  // it as a plain required string so yup-inferred TS types stay flexible
  // for the SelectDropdown integration.
  statusFault: yup.string().required('Stato richiesto'),
  commentMaintenanceWorker: yup.string().optional().default(''),
  actualDuration: yup.number().when('statusFault', {
    is: 'Completed',
    then: schema =>
      schema
        .typeError('Durata effettiva richiesta')
        .min(1, 'Minimo 1 minuto')
        .required('Durata effettiva obbligatoria'),
    otherwise: schema =>
      schema
        .transform((value, original) =>
          original === '' || original === null || original === undefined
            ? undefined
            : value
        )
        .min(1, 'Minimo 1 minuto')
        .optional(),
  }),
  suspensionReason: yup.string().when('statusFault', {
    is: 'Suspended',
    then: schema =>
      schema
        .trim()
        .min(3, 'Minimo 3 caratteri')
        .required('Motivo della sospensione obbligatorio'),
    otherwise: schema => schema.optional().default(''),
  }),
  materialRequest: yup.string().optional().default(''),
});

export type MaintainerUpdateValues = yup.InferType<
  typeof maintainerUpdateSchema
>;
