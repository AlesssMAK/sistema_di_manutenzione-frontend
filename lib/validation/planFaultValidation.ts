import * as yup from 'yup';

export const planFaultSchema = yup.object({
  priority: yup
    .string()
    .oneOf(['Low', 'Medium', 'High'], 'Priorità non valida')
    .required('Priorità obbligatoria'),
  plannedDate: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato data: YYYY-MM-DD')
    .required('Data pianificata obbligatoria')
    // Mirror the backend guard (addedByManagerSchema): a plan can't be
    // dated in the past. Surfacing it here shows an inline message on
    // the field instead of the raw 400 the API would otherwise return.
    .test(
      'not-past',
      'La data pianificata non può essere nel passato',
      (value) => {
        if (!value) return true;
        const now = new Date();
        const today = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        // Both strings are YYYY-MM-DD, so lexical >= is a date compare.
        return value >= today;
      }
    ),
  plannedTime: yup
    .string()
    .matches(/^\d{2}:\d{2}$/, 'Formato ora: HH:mm')
    .required('Ora pianificata obbligatoria'),
  estimatedDuration: yup
    .number()
    .typeError('Durata richiesta')
    .min(1, 'Minimo 1 minuto')
    .required('Durata stimata obbligatoria'),
  deadline: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato data: YYYY-MM-DD')
    .required('Scadenza obbligatoria')
    .test(
      'after-planned',
      'La scadenza deve essere dopo la data pianificata',
      function (value) {
        const { plannedDate } = this.parent as { plannedDate?: string };
        if (!value || !plannedDate) return true;
        return value >= plannedDate;
      }
    ),
  managerComment: yup
    .string()
    .max(2000, 'Massimo 2000 caratteri')
    .optional()
    .default(''),
  assignedMaintainers: yup
    .array()
    .of(yup.string().required())
    .default([]),
});

export type PlanFaultValues = yup.InferType<typeof planFaultSchema>;

/**
 * Reduced schema for the reassign-only mode of PlanFaultForm. Only
 * the maintainers list matters; the other planning fields stay in
 * the form (as defaults from the current fault) but are not edited
 * or validated. Field names match planFaultSchema so the same
 * useForm typings work for both modes.
 */
export const reassignFaultFormSchema = yup.object({
  priority: yup.string().oneOf(['Low', 'Medium', 'High']).default('Medium'),
  plannedDate: yup.string().default(''),
  plannedTime: yup.string().default(''),
  estimatedDuration: yup.number().default(0),
  deadline: yup.string().default(''),
  managerComment: yup.string().max(2000, 'Massimo 2000 caratteri').default(''),
  assignedMaintainers: yup
    .array()
    .of(yup.string().required())
    .min(1, 'Selezionare almeno un manutentore')
    .default([]),
});

/**
 * Append-only variant: the form starts with an empty selection
 * (already-assigned maintainers are shown as readonly chips
 * separately) and validates that at least one new maintainer was
 * picked before submitting.
 */
export const addMaintainersFormSchema = yup.object({
  priority: yup.string().oneOf(['Low', 'Medium', 'High']).default('Medium'),
  plannedDate: yup.string().default(''),
  plannedTime: yup.string().default(''),
  estimatedDuration: yup.number().default(0),
  deadline: yup.string().default(''),
  managerComment: yup.string().max(2000, 'Massimo 2000 caratteri').default(''),
  assignedMaintainers: yup
    .array()
    .of(yup.string().required())
    .min(1, 'Selezionare almeno un manutentore da aggiungere')
    .default([]),
});
