import * as yup from 'yup';

// Backend mirrors these bounds — see
// backend/src/validations/messageValidation.js
// (createDirectMessageSchema + createBroadcastSchema). Keep them in sync.
export const composeMessageSchema = yup.object({
  channel: yup
    .string()
    .oneOf(['direct', 'broadcastAll', 'broadcastRole'])
    .required(),
  // Required when channel === 'direct'.
  recipientId: yup
    .string()
    .when('channel', {
      is: 'direct',
      then: (schema) => schema.required('Selezionare un destinatario'),
      otherwise: (schema) => schema.optional().default(''),
    })
    .default(''),
  // Required when channel === 'broadcastRole'.
  targetRole: yup
    .string()
    .oneOf(['operator', 'admin', 'manager', 'maintenanceWorker', 'safety', ''])
    .when('channel', {
      is: 'broadcastRole',
      then: (schema) =>
        schema
          .oneOf(
            ['operator', 'admin', 'manager', 'maintenanceWorker', 'safety'],
            'Selezionare un ruolo',
          )
          .required('Selezionare un ruolo'),
      otherwise: (schema) => schema.optional().default(''),
    })
    .default(''),
  subject: yup
    .string()
    .max(200, 'Massimo 200 caratteri')
    .optional()
    .default(''),
  body: yup
    .string()
    .trim()
    .min(1, 'Il messaggio è obbligatorio')
    .max(5000, 'Massimo 5000 caratteri')
    .required('Il messaggio è obbligatorio'),
});

export type ComposeMessageValues = yup.InferType<typeof composeMessageSchema>;
