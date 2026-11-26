# Cómo contribuir

## Primer arranque

1. Node 22.9 o superior (`nvm use`) y Docker.
2. `cp .env.example .env` y completar las variables (como mínimo `POSTGRES_PASSWORD`, `DATABASE_URL` y `DATABASE_URL_TEST`).
3. `npm install`
4. `npm run dev` → Postgres en `localhost:5432`, API en `localhost:3000`, web en `localhost:5173`.

## Flujo de trabajo

1. **Spec primero.** Cada feature tiene su spec en `specs/NNN-nombre/spec.md` (`draft → approved → in-progress → done`). No se implementa nada sin spec `approved`.
2. Las decisiones de arquitectura se registran como ADR en `docs/adr/NNNN-titulo.md`.
3. Una rama por PR, a partir de `main`: `feat/…`, `fix/…`, `chore/…`.
4. PRs chicos, siguiendo la división en PRs de la spec.
5. Antes de abrir el PR: `npm run lint && npm run typecheck && npm test` en verde.
6. Commits con Conventional Commits, en español.

## Reglas

Las reglas fijas del proyecto están en [AGENTS.md](AGENTS.md). Las más importantes:

- Permisos siempre en la API, con test.
- Nunca credenciales en el código ni `.env` en el repo.
