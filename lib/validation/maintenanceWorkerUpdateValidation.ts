import * as yup from 'yup';

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'In progress': ['Completed', 'Suspended'],
  // A paused fault must be resumed before it can be finalized — so the
  // only action offered on a Suspended fault is Riprendi (→ In progress).
  // Finalizza/Sospendi reappear once it's back In progress.
  Suspended: ['In progress'],
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
  // Always optional here: the floor (never below the already-worked time)
  // and the 15-minute default for an empty picker are applied in the
  // modal's onSubmit / on the backend, not via a static min() — the floor
  // is dynamic (depends on the fault's accumulated worked time).
  actualDuration: yup
    .number()
    .transform((value, original) =>
      original === '' || original === null || original === undefined
        ? undefined
        : value
    )
    .optional(),
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
