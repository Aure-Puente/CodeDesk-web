# CodeDesk

Panel personal para organizar proyectos, tareas, pagos, notas, enlaces, credenciales y accesos a Firebase.

**Stack:** React 19 · Vite 8 · MUI 9 · MUI X (Charts y Date Pickers) · Firebase (Auth, Firestore, Storage) · dnd-kit · dayjs · react-colorful

## Scripts

| Comando           | Qué hace                                 |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Servidor de desarrollo                   |
| `npm run build`   | Build de producción (`dist/`)            |
| `npm run preview` | Sirve el build localmente                |
| `npm run lint`    | Lint con Oxlint                          |
| `npm run format`  | Formatea `src/` con Prettier (ancho 100) |

Las variables `VITE_FIREBASE_*` van en `.env` (ver `src/firebase/firebase.js`). **`.env` no se sube al repo.**

## Estructura

```
src/
├── App.jsx                 Rutas (login público / panel privado)
├── assets/images/          Logos (completo claro/oscuro, ícono y símbolo)
├── context/                Auth y modo claro/oscuro
├── firebase/               Inicialización de Firebase
├── theme/                  Tema de MUI (paleta `app.*`, scrollbars)
├── pages/
│   ├── Login/              Inicio de sesión (siempre oscuro, logo protagonista)
│   └── Dashboard/          Layout: menú con logo, saludo, reloj, perfil y sección activa (carga diferida)
├── components/             Una carpeta por sección
│   ├── Home/  Tareas/  Proyectos/  Pagos/  Notas/
│   └── Informes/  DataBase/  Enlaces/  Credenciales/
└── shared/                 Código reutilizado por todas las secciones
    ├── hooks/useUserCollection.js   Suscripción en tiempo real a una colección del usuario
    ├── utils/index.js               URLs, montos, fechas, pagos, portapapeles, campos de proyecto
    └── ui/                          Componentes y estilos comunes
        ├── styles.js                Animaciones, tarjetas, colores suaves, props de menús
        ├── Stack.jsx                Stack compatible con MUI 9 (alignItems/justifyContent/flexWrap)
        ├── PageHeader, StatsGrid, EmptyState, SectionLabel, Section, PageShell
        ├── Dialogs (AppDialog, FormDialog, ConfirmDialog/DeleteDialog)
        ├── Filters (FilterBar, FilterSelect, SearchField, projectFilterOptions), Toast, Chips, InfoBox
        ├── ProjectAvatar, ProjectSelect (ProjectOption, IconOption), OptionToggle
        └── DateField                Date picker de MUI X en castellano (valor "YYYY-MM-DD")
```

## Convenciones de UI

- Pensado para notebook (1366×657) sin perder escritorio grande ni mobile.
- Los selectores de proyecto muestran siempre el **logo** del proyecto al lado del nombre.
- Fechas con `DateField`: meses en castellano con mayúscula (locale dayjs `es-cap`).
- Montos escritos a mano (sin flechitas), limpiados con `cleanAmount`.
- Los modales de eliminar/confirmar usan `ConfirmDialog`: ícono con halo, vista previa centrada de lo
  que se borra y spinner mientras procesa.

## Secciones

### Inicio

Tarjeta de foco con la tarea en progreso más prioritaria y la siguiente (con el logo de su proyecto),
resumen de tareas, avance por proyecto y panel **Por cobrar** (pendiente, cobrado en el mes y últimos
pagos recibidos).

### Tareas

- Vista **Tablero** o **Lista** (se recuerda la elección). Orden de estados: **En progreso → Pendiente
  → Pausada → Completada**, tanto en columnas como en la lista y en Inicio.
- Las tareas nuevas se crean siempre **En progreso**; también hay alta rápida con Enter desde la columna.
- Arrastrar para priorizar o mover entre columnas. Cada columna scrollea por su cuenta con una barra fina
  que aparece al pasar el mouse.
- **Checklist**: varias subtareas dentro de una tarea (pegar una lista crea un ítem por línea). En la
  tarjeta se ven hasta 3 ítems en una línea, con los **pendientes primero**, y se tildan desde ahí; el
  detalle muestra todos.
- Al tildar todos los ítems la tarea se **completa sola** (con opción de deshacer); si destildás uno,
  vuelve a En progreso.
- **Prioridad** (alta/media/baja) y **fecha límite** con aviso de vencida / vence hoy, y filtro de vencidas.
- Las completadas se muestran compactas y se cargan de a poco ("Ver N más").
- El orden se guarda con escrituras mínimas (`writeBatch`, solo lo que cambió).

### Proyectos

Logo, cliente, tipo y estado. Color libre con selector **HEX** (`react-colorful`). El detalle se organiza
en pestañas: Resumen, Tareas, Notas y Enlaces.

### Pagos

Cobros con pagos parciales, saldos separados en pesos y dólares y fecha con date picker.

### Informes

Gráficos con MUI X Charts (barras, dona y medidores) sobre tareas, proyectos y cobros.

### Notas, Enlaces, Base de datos y Credenciales

Tarjetas compactas con búsqueda y filtro por proyecto. Credenciales permite mostrar/copiar datos sin
dejarlos visibles.

## Firestore

Colecciones (todas filtradas por `userId`): `projects`, `tasks`, `notes`, `payments`, `projectLinks`,
`credentials`, `databasesInfo`, `users`. Al editar el nombre, color o logo de un proyecto, esos datos se
actualizan también en todo lo vinculado. Al eliminar un proyecto, lo vinculado no se borra: queda guardado
con el nombre del proyecto.

Las reglas de seguridad solo permiten a cada usuario leer y escribir sus propios documentos (`userId`
igual a su `uid`, también al actualizar). En Storage, cada usuario accede solo a su carpeta y las imágenes
tienen un máximo de 5 MB.