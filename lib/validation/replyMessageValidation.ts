import * as yup from 'yup';

// Consistent with planFaultValidation style: inline italian error messages.
// Backend Joi rules (messageValidation.replyMessageSchema) mirror these
// bounds — keep both in sync if you change one.
export const replyMessageSchema = yup.object({
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

export type ReplyMessageValues = yup.InferType<typeof replyMessageSchema>;
