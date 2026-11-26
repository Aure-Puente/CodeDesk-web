// Punto de entrada de la API. Fastify, validación de entorno y /health llegan en el PR 2 (feat(api): base).
import { roleSchema } from '@duwoh/shared';

console.warn(
  `[api] esqueleto listo (roles: ${roleSchema.options.join(', ')}). Servidor pendiente del PR 2.`,
);
