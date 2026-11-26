---
id: 000-fundaciones
autor: martin
estado: in-progress     # draft → approved → in-progress → done
fecha: 2026-11-26
adr: docs/adr/0001-backend-propio-postgres.md
---

# Fase 0 — Fundaciones del Panel Duwoh

## Objetivo

Construir desde cero la base del Panel Duwoh: **monorepo en TypeScript, API propia con Postgres, autenticación propia (email/contraseña y Google), usuarios con roles y permisos por proyecto, y los primeros recursos: clientes, proyectos y tareas.**

Esta fase no incluye módulos de negocio (finanzas, leads, tickets, SEO). Deja la base para que cada uno sea una spec independiente.

## Contexto

- Se parte de cero: **no se migran datos** de CodeDesk ni de Firestore.
- **Firebase se elimina por completo** (Auth, Firestore y Storage).
- CodeDesk queda como **referencia visual**: tema, componentes compartidos (`shared/ui`), layout del Dashboard y Login se copian y se convierten a TypeScript. La carpeta original de CodeDesk no se modifica.
- Decisión de arquitectura: ver [ADR 0001](../../docs/adr/0001-backend-propio-postgres.md).

## Usuarios y roles

| Usuario | Rol | Ve |
| --- | --- | --- |
| Martin | `admin` | Todo |
| Ema | `admin` | Todo |
| Brenda | `member` | Solo los proyectos a los que está asignada. Sección SEO en una fase posterior |
| Aure | `member` | Solo los proyectos a los que está asignado |

**Clientes como usuarios:** no entran en esta fase. El modelo debe permitir agregar más adelante un rol `client` sin rediseñar tablas.

## Permisos

| Acción | `admin` | `member` |
| --- | --- | --- |
| Gestionar usuarios y roles | Sí | No |
| Ver clientes | Todos, ficha completa | Solo clientes de sus proyectos: nombre, dominios y fichas de Google |
| Crear / editar clientes | Sí | No |
| Ver proyectos | Todos | Solo asignados |
| Crear / archivar proyectos, asignar personas | Sí | No |
| Editar proyectos | Sí | Solo asignados |
| Ver / crear / editar tareas | Todas | Solo de proyectos asignados |

Regla técnica: **los permisos se validan en la API, nunca solo en el front.** El front oculta lo que no corresponde, pero la API es la que niega.

## Alcance

### 1. Estructura del repo (monorepo, npm workspaces)

```
panel-duwoh/
├── apps/
│   ├── web/              ← React + Vite + TypeScript + MUI
│   └── api/              ← Node + Fastify + TypeScript
├── packages/
│   └── shared/           ← schemas Zod y tipos compartidos (contrato front–API)
├── specs/                ← specs por feature
├── docs/adr/             ← decisiones de arquitectura
├── docker-compose.yml    ← Postgres local
├── AGENTS.md             ← reglas para la IA (Claude Code, Codex, Cursor)
├── CONTRIBUTING.md
└── .env.example          ← todas las variables, sin valores reales
```

- TypeScript en modo `strict` en todos los paquetes.
- Scripts en la raíz: `dev`, `build`, `lint`, `typecheck`, `test`, `db:migrate`, `db:seed`.
- **CI fuera de esta fase** (se agrega después). Los scripts tienen que dejarla lista para enchufar.

### 2. Backend (`apps/api/`)

- Node 22 + TypeScript, Fastify, Drizzle ORM con migraciones versionadas, validación con Zod (schemas de `packages/shared`).
- Postgres 16: Docker Compose en local, Railway en producción.
- **Configuración por variables de entorno**, validadas con Zod al arrancar: si falta una, la API no inicia y dice cuál. Ninguna clave ni URL de servicio escrita en el código. `.env` en `.gitignore`; `.env.example` versionado.
- Endpoint `GET /health`.
- Seed inicial: crea los usuarios admin (Martin y Ema) a partir de variables de entorno.

### 3. Autenticación

**Métodos**

- Email + contraseña.
- **Google** (OAuth 2.0 / OpenID Connect). Solo entra si el email de Google corresponde a un usuario **ya registrado y activo**. No hay registro abierto: los usuarios los crea un admin.

**Contraseñas**

- Hash con **Argon2id** (parámetros recomendados por OWASP). Nunca se guardan ni se loguean en claro.
- Política: mínimo 12 caracteres y fortaleza mínima medida con zxcvbn (puntaje ≥ 3). Se valida en front y en API.

**Sesión**

- **Access token** (JWT) de 15 minutos en cookie `httpOnly`, `Secure`, `SameSite=Lax`.
- **Refresh token** opaco en cookie `httpOnly`, rotativo (cada uso emite uno nuevo e invalida el anterior), guardado **hasheado** en la tabla `sessions`.
- **Duración máxima de la sesión: 8 horas** desde el login, aunque haya actividad. Pasado ese tiempo, hay que volver a iniciar sesión.
- Reuso de un refresh token ya rotado = posible robo → se revocan todas las sesiones de ese usuario.
- Logout revoca la sesión actual. Desactivar un usuario revoca todas sus sesiones.
- Front en Vercel (`panel.duwohdevelopers.com`) y API en Railway (`api.duwohdevelopers.com`): mismo dominio raíz, para que las cookies funcionen sin `SameSite=None`.
- Protección CSRF: verificación del header `Origin` en toda petición que modifica datos.

**Recupero de contraseña**

- Token aleatorio de 32 bytes, guardado hasheado, **válido 15 minutos** y de un solo uso.
- Se envía por email con Resend.
- La respuesta es siempre la misma exista o no el email (no revela qué cuentas existen).
- Al cambiar la contraseña se revocan todas las sesiones abiertas.

**Límite de intentos**

- Login y pedido de recupero: máximo 5 intentos cada 15 minutos por IP + email. Después, respuesta 429.

### 4. Modelo de datos inicial

| Tabla | Campos principales |
| --- | --- |
| `users` | id, email (único), nombre, password_hash (nullable si solo usa Google), google_sub (nullable, único), rol (`admin` \| `member`), activo, timestamps |
| `sessions` | id, user_id, refresh_token_hash, expires_at (8 h desde login), last_used_at, revoked_at, user_agent, ip |
| `password_reset_tokens` | id, user_id, token_hash, expires_at (15 min), used_at |
| `clients` | id, nombre, contacto, teléfono, email, país, CUIT, tipo_mantenimiento, estado, responsable_id (→ users), fecha_ultimo_pago, observaciones, timestamps |
| `client_domains` | id, client_id, dominio, principal (bool) |
| `client_google_profiles` | id, client_id, nombre, url (ficha de Google Business) |
| `projects` | id, client_id (nullable), nombre, tipo, estado, color, logo_url, timestamps, archived_at |
| `project_members` | project_id, user_id (PK compuesta) |
| `tasks` | id, project_id, título, descripción, estado, prioridad, fecha_limite, orden, checklist (jsonb), assignee_id, created_by, timestamps |

- `tipo_mantenimiento`: `ninguno` · `trabajo_unico` · `tecnico` · `seo_local` · `seo_web` · `completo`.
- `estado` del cliente: `activo` · `pausado` · `baja`.
- Un cliente puede tener **varios dominios** y **varias fichas de Google**.
- `fecha_ultimo_pago` se carga a mano en esta fase. En la fase de finanzas pasa a calcularse a partir de los cobros.
- `responsable_id` apunta a un usuario admin (Martin o Ema).

### 5. API — contrato

Respuestas de error con forma `{ error: { code, message } }`. Todas las rutas requieren sesión, salvo las de `/auth` y `/health`.

| Método y ruta | Permiso | Descripción |
| --- | --- | --- |
| `POST /auth/login` | Público | Email + contraseña |
| `GET /auth/google` · `GET /auth/google/callback` | Público | Login con Google |
| `POST /auth/refresh` | Cookie de refresh | Rota tokens |
| `POST /auth/logout` | Sesión | Revoca la sesión actual |
| `POST /auth/forgot-password` · `POST /auth/reset-password` | Público | Recupero de contraseña |
| `GET /me` · `PATCH /me/password` | Sesión | Usuario actual, cambio de contraseña |
| `GET /users` · `POST /users` · `PATCH /users/:id` | admin | Alta, rol, activar/desactivar |
| `GET /clients` · `GET /clients/:id` | admin; member con campos limitados | Clientes |
| `POST /clients` · `PATCH /clients/:id` | admin | Alta y edición, con dominios y fichas |
| `GET /projects` · `GET /projects/:id` | admin: todos; member: asignados | Proyectos |
| `POST /projects` · `PUT /projects/:id/members` | admin | Alta y asignación |
| `PATCH /projects/:id` | admin o asignado | Edición |
| `GET /projects/:id/tasks` · `POST /projects/:id/tasks` | admin o asignado | Tareas |
| `PATCH /tasks/:id` · `DELETE /tasks/:id` | admin o asignado al proyecto | Edición |
| `PATCH /projects/:id/tasks/order` | admin o asignado | Reordenar en lote |

### 6. Front (`apps/web/`)

- React + Vite + **TypeScript** + MUI. Tema, layout y componentes compartidos tomados de CodeDesk y convertidos a TS.
- **Capa de datos separada:** `src/api/` con un cliente HTTP (cookies, refresh automático ante 401, redirección a login si la sesión venció) y un módulo por recurso. Los componentes no llaman a `fetch` directamente.
- **Rutas por sección:** `/login`, `/recuperar`, `/restablecer/:token`, `/`, `/clientes`, `/clientes/:id`, `/proyectos`, `/proyectos/:id`, `/tareas`, `/usuarios`.
- Pantallas de esta fase:
  - **Login** con email/contraseña y botón "Ingresar con Google", más recupero de contraseña.
  - **Usuarios** (solo admin): alta, rol, activar/desactivar, proyectos asignados.
  - **Clientes:** listado con filtros por estado, tipo de mantenimiento y responsable; ficha con dominios y fichas de Google.
  - **Proyectos:** listado y detalle con miembros y tareas.
  - **Tareas:** tablero y lista (comportamiento de CodeDesk: estados, prioridad, fecha límite, checklist, arrastrar para reordenar).
- Menú según rol: un `member` no ve Usuarios ni la ficha completa de clientes.
- Ningún componente de más de ~300 líneas.

### 7. Calidad

- `AGENTS.md`: stack, comandos, convenciones y reglas fijas ("permisos siempre en la API", "nunca credenciales en el código", "nunca commitear `.env`").
- Lint (ESLint u Oxlint) y `typecheck` sin errores en todo el monorepo.
- Tests con Vitest, corriendo en local contra Postgres de Docker. Mínimos exigidos:
  - **Auth:** hash Argon2id; login correcto e incorrecto; sesión expira a las 8 h; rotación de refresh token; reuso detectado revoca sesiones; token de recupero expira a los 15 min y es de un solo uso; límite de intentos; Google con email no registrado es rechazado.
  - **Permisos:** un `member` no puede leer ni modificar proyectos, tareas ni clientes fuera de sus proyectos (un test por endpoint de la tabla del punto 5).
  - Usuario desactivado no accede a ningún endpoint.

## Fuera de alcance

- CI con GitHub Actions (spec propia, a continuación de esta fase).
- Finanzas, leads, tickets, sección SEO, mensajería, Slack y Claude.
- Notas, enlaces, credenciales, informes y "base de datos" de CodeDesk: se rehacen en specs propias si se necesitan.
- Rol `client` y portal de clientes.
- Migración de datos existentes.
- Autenticación de dos factores (candidata para una spec posterior).

## Criterios de aceptación

- [ ] El monorepo tiene la estructura del punto 1 y `npm run dev` levanta web, API y Postgres en local.
- [ ] No queda ninguna dependencia ni llamada a Firebase.
- [ ] Ninguna credencial en el código; la API no arranca si falta una variable de entorno y dice cuál.
- [ ] Login con email/contraseña y con Google funcionan; Google rechaza emails no registrados.
- [ ] La sesión vence a las 8 horas aunque haya actividad.
- [ ] El recupero de contraseña funciona por email y el enlace vence a los 15 minutos.
- [ ] Martin y Ema (admin) ven todos los clientes, proyectos y tareas.
- [ ] Brenda y Aure (member) ven solo sus proyectos y tareas, tanto en la UI como llamando a la API directamente.
- [ ] Un usuario desactivado no puede entrar ni usar una sesión que ya tenía abierta.
- [ ] Un admin crea usuarios, cambia roles, desactiva y asigna proyectos desde la UI.
- [ ] Clientes con varios dominios y varias fichas de Google, tipo de mantenimiento, estado, responsable y fecha de último pago.
- [ ] Tablero de tareas: crear, editar, mover entre columnas, reordenar y checklist funcionan.
- [ ] Cada sección tiene su URL y recargar la página no saca de la sección.
- [ ] Lint, typecheck y tests en verde.
- [ ] API y Postgres desplegados en Railway (`api.duwohdevelopers.com`) y front en Vercel (`panel.duwohdevelopers.com`), funcionando en producción.

## Decisiones ya tomadas para próximas fases

Registradas acá para que no se pierdan; se desarrollan en su spec.

- **Finanzas:** solo `admin`.
  - Cada ingreso registra **quién cobró** (Martin o Ema). Reemplaza la columna M/E del Excel.
  - Cada movimiento guarda moneda, monto y **tipo de cambio del día**. Balances **separados por moneda**, con equivalencia en pesos solo informativa.
  - `fecha_ultimo_pago` del cliente pasa a calcularse desde los cobros.
  - Importación del Excel `PAGOS_2026.xlsx` (Clientes, Mantenimiento, Ingresos, Egresos).
- **SEO:** sección propia para Brenda, con tickets separados de los de desarrollo.
- **Clientes en el panel:** objetivo a futuro, no prioritario.

## División en PRs

1. `chore: monorepo` — estructura, workspaces, TypeScript strict, lint, Docker Compose, `.env.example`, `AGENTS.md`.
2. `feat(api): base` — Fastify, Drizzle, validación de entorno, `/health`, tabla `users`, seed de admins.
3. `feat(api): auth` — login, sesiones con refresh rotativo y máximo de 8 h, logout, recupero de contraseña, límite de intentos. Tests de auth.
4. `feat(api): google` — login con Google para usuarios registrados. Tests.
5. `feat(api): usuarios, clientes, proyectos y tareas` — tablas, endpoints y tests de permisos.
6. `feat(web): base` — app TS con tema y componentes de CodeDesk, capa de datos, rutas, login y recupero.
7. `feat(web): secciones` — usuarios, clientes, proyectos y tareas; menú según rol.
8. `chore: deploy` — Railway (API + Postgres), Vercel (front), subdominios de `duwohdevelopers.com` y variables de entorno.
