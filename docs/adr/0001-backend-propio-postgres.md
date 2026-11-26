# ADR 0001 — Backend propio con Postgres en lugar de Firebase

- **Estado:** aceptada
- **Fecha:** 2026-11-26
- **Spec relacionada:** [000-fundaciones](../../specs/000-fundaciones/spec.md)

## Contexto

CodeDesk era un panel personal: React en el navegador hablando directo con Firebase (Auth, Firestore y Storage). Las reglas de acceso vivían en las reglas de Firestore y en el front.

El Panel Duwoh lo usa un equipo (dos admins y miembros con acceso por proyecto), maneja datos de clientes y en próximas fases va a manejar finanzas. Necesita:

- Permisos por rol y por proyecto que se validen en un solo lugar del servidor y se puedan testear.
- Datos relacionales (clientes ↔ dominios ↔ proyectos ↔ miembros ↔ tareas, y más adelante cobros) con consultas y reportes.
- Control total sobre la sesión (duración máxima, revocación, rotación de tokens).

## Decisión

- **API propia** en Node + TypeScript (Fastify) desplegada en Railway.
- **Postgres 16** como única base de datos (Railway en producción, Docker Compose en local), con **Drizzle ORM** y migraciones versionadas.
- **Autenticación propia**: email + contraseña (Argon2id) y Google OAuth solo para usuarios ya registrados; sesiones con cookies `httpOnly`, refresh token rotativo y máximo de 8 h.
- **Contrato compartido** front–API con schemas Zod en `packages/shared`.
- **Firebase se elimina por completo.** No se migran datos.

## Consecuencias

- (+) Los permisos se validan y testean en la API; el front solo oculta.
- (+) Modelo relacional apto para finanzas y reportes.
- (+) Sin dependencia de un proveedor para auth ni datos.
- (−) Hay que operar y mantener la API, la base, backups y la seguridad de la autenticación.
- (−) Se pierde el tiempo real de Firestore; si hace falta se agrega después (polling, SSE o websockets).
- (−) Front y API tienen que compartir dominio raíz (`duwohdevelopers.com`) para usar cookies `SameSite=Lax`.
