import { z } from 'zod';

/** Forma única de las respuestas de error de la API: `{ error: { code, message } }`. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
