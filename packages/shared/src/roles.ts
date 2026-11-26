import { z } from 'zod';

/** Roles de usuario. Preparado para sumar `client` en una fase posterior. */
export const roleSchema = z.enum(['admin', 'member']);
export type Role = z.infer<typeof roleSchema>;
