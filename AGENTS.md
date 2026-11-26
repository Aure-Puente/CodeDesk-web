# AGENTS.md — Panel Duwoh

Reglas para cualquier agente de IA (Claude Code, Codex, Cursor) y para personas que trabajen en este repo.

## Reglas fijas (no se negocian)

1. **Los permisos se validan siempre en la API.** El front solo oculta lo que no corresponde; la API es la que niega. Todo endpoint nuevo lleva su test de permisos.
2. **Nunca credenciales en el código.** Claves, tokens, contraseñas y URLs de servicios van en variables de entorno, validadas con Zod al arrancar. Si se agrega una variable, se agrega también a `.env.example` (sin valor real).
3. **Nunca commitear `.env`** ni ningún archivo con secretos.
4. **Sin Firebase.** No se agregan dependencias ni llamadas a Firebase.
5. **Contraseñas y tokens nunca en claro**: ni en la base (se guardan hasheados) ni en logs.
6. **Trabajo guiado por specs**: antes de implementar una feature, debe existir su spec en `specs/` con estado `approved`. Las decisiones de arquitectura van en `docs/adr/`.

## Stack

| Parte | Tecnología |
| --- | --- |
| Monorepo | npm workspaces, Node ≥ 22.9, TypeScript `strict` |
| `apps/web` | React 19 + Vite + TypeScript + MUI |
| `apps/api` | Node + Fastify + TypeScript, Drizzle ORM, Zod |
| `packages/shared` | Schemas Zod y tipos compartidos (contrato front–API) |
| Base de datos | Postgres 16 (Docker Compose en local, Railway en producción) |
| Tests | Vitest, contra el Postgres de Docker |
| Lint / formato | Oxlint, Prettier |

## Comandos (desde la raíz)

| Comando | Qué hace |
| --- | --- |
| `npm install` | Instala todos los workspaces |
| `npm run dev` | Levanta Postgres (Docker), API y web |
| `npm run build` | Build de todos los paquetes |
| `npm run lint` | Oxlint en todo el monorepo |
| `npm run typecheck` | `tsc` en cada workspace |
| `npm test` | Vitest en cada workspace |
| `npm run db:up` / `db:down` | Levanta / baja Postgres local |
| `npm run db:migrate` | Aplica migraciones (Drizzle). *Desde el PR 2; hoy falla avisando.* |
| `npm run db:seed` | Crea los admins iniciales desde `.env`. *Desde el PR 2; hoy falla avisando.* |

Antes de dar un cambio por terminado: `npm run lint && npm run typecheck && npm test`.

## Convenciones

- Código, nombres de archivos y de símbolos en **inglés**; textos de UI, specs, ADRs y commits en **español**.
- Commits con [Conventional Commits](https://www.conventionalcommits.org/es/): `feat(api): …`, `fix(web): …`, `chore: …`.
- Los schemas de requests y responses viven en `packages/shared` y se usan en los dos lados. No duplicar tipos.
- Errores de la API siempre con forma `{ error: { code, message } }`.
- En el front, los componentes no llaman a `fetch`: usan los módulos de `apps/web/src/api/`.
- Ningún componente de más de ~300 líneas: dividir.
- Sin `any`. Validar en los bordes (requests, variables de entorno, respuestas externas) con Zod.
- `legacy/codedesk/` es solo referencia visual de CodeDesk (tema, `shared/ui`, Dashboard y Login). No se edita, no se importa y se elimina al terminar la fase 0.

## Estructura

```
apps/web/          front
apps/api/          API
packages/shared/   contrato compartido
specs/             specs por feature (una carpeta por spec)
docs/adr/          decisiones de arquitectura
docker/            scripts de inicialización de Postgres local
legacy/codedesk/   referencia de CodeDesk (temporal)
```

## Paquetes internos (`packages/*`)

- Se exportan con la condición `@duwoh/source` → código TS (la usan Vite, tsx y `tsc` en desarrollo y typecheck) y, por defecto, `dist/` compilado (lo usa Node en producción).
- `npm run build` en la raíz compila `packages/*` antes que `apps/*`.
