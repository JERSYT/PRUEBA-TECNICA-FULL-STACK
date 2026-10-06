# Decisiones Técnicas — Mesa de Ayuda Tecnológica

Este documento complementa al `README.md` y explica **por qué** se tomaron las decisiones de arquitectura, organización, validaciones/DTOs y testing. Está pensado para defender el proyecto en la revisión técnica.

## 1. Visión general del problema

La prueba pide un CRUD de solicitudes con requisitos no triviales:

- Entidad `Ticket` con 8 campos + 3 enums (categoría, prioridad, estado).
- Entidad `TicketHistory` de auditoría obligatoria por cada cambio de estado.
- Máquina de estados con transiciones permitidas/prohibidas + regla especial para prioridad Crítica.
- Listado con búsqueda textual, 3 filtros combinables, orden dinámico y paginación.
- Validaciones en frontend **y** backend, Git con `main`/`develop` + 5 commits, README, Swagger, tests y Docker como opcionales que suman puntos.

La solución prioriza **correctitud y trazabilidad** sobre cantidad de features: una máquina de estados bien testeada vale más que notificaciones o websockets a medias.

## 2. Arquitectura elegida: Capas (Layered) + separación frontend/backend

### 2.1 Por qué no MVC monolítico ni Clean Architecture completa

- Para un Junior de 4–6 horas, Clean Architecture con casos de uso, repositorios abstractos e inyección de dependencias añade ceremonia sin beneficio medible.
- Un MVC sin capas de servicio mezcla SQL y reglas de negocio en los controladores y hace imposible testear transiciones sin HTTP.
- La **arquitectura en capas** es el punto medio: cada capa tiene una responsabilidad y se puede testear aislada.

### 2.2 Backend: `routes → controllers → services → prisma`

```text
backend/src/
├── routes/ticket.routes.ts       # Solo mapeo HTTP → controller
├── controllers/ticket.controller.ts # Parsea, valida con Zod, formatea respuesta {success,data,message}
├── schemas/ticket.schema.ts      # DTOs + validaciones (contratos de entrada)
├── services/
│   ├── businessRules.service.ts  # Máquina de estados pura (sin I/O, 100% testeable)
│   └── ticket.service.ts         # Orquestación: Prisma + transacciones + reglas
├── docs/swagger.ts               # OpenAPI 3.0 estático
├── app.ts                        # Express, CORS, /api-docs, middleware global de errores
├── index.ts                      # listen(PORT)
└── prisma.ts                     # Singleton PrismaClient
prisma/
├── schema.prisma                 # Modelos Ticket + TicketHistory + enums
├── migrations/                   # SQL versionado
└── seed.ts                       # 6 tickets realistas con historial coherente
tests/
├── businessRules.test.ts         # 8 tests unitarios de la máquina de estados
└── tickets.api.test.ts           # 11 tests de integración HTTP (Supertest)
```

**Separación de responsabilidades:**

| Capa | Sabe de HTTP | Sabe de SQL | Sabe de reglas |
|---|---|---|---|
| Routes | Sí (mínimo) | No | No |
| Controllers | Sí | No | No (delegan) |
| Schemas (Zod) | No | No | Validación sintáctica |
| businessRules.service | No | No | Validación semántica (transiciones) |
| ticket.service | No | Sí | Orquesta reglas + persistencia |

Esto permite que `validateStatusTransition()` se testee sin base de datos (8 tests en <10ms) y que `ticket.service` se testee vía HTTP sin acoplar Express a Prisma directamente.

### 2.3 Frontend: features por dominio + servicios + componentes presentacionales

```text
frontend/src/
├── types/ticket.ts               # Contratos TS espejo del backend (Category, Priority, Status, Ticket, Pagination)
├── services/ticketApi.ts         # fetch wrapper con handleResponse (lanza Error con message del backend)
├── components/
│   ├── StatsOverview.tsx         # 5 tarjetas clicables que actúan como filtro de estado
│   ├── TicketFilters.tsx         # Búsqueda (debounce 350ms) + 3 selects + orden + reset
│   ├── TicketTable.tsx           # Tabla + badges + paginador numérico + acciones
│   ├── TicketFormModal.tsx       # Crear/editar con validación local espejo del backend
│   ├── ChangeStatusModal.tsx     # Solo muestra transiciones válidas + exige observación si Crítica→Resuelta
│   └── TicketDetailModal.tsx     # Ficha + timeline vertical del historial
├── App.tsx                       # Estado global mínimo (stats, tickets, filtros, página, modales) + Toaster
└── main.tsx
e2e/
├── ticket-validations.spec.ts    # 4 tests: vacíos, longitudes, crear, filtrar
└── critical-business-rules.spec.ts # 1 test: Crítica→Resuelta sin/con observación
```

**Por qué sin Redux/Pinia/React-Query:** el estado es local y efímero (filtros + página + lista). Añadir un store global o caché complicaría la prueba sin aportar valor; `useState + useCallback + useEffect` con `fetch` es suficiente y legible para un Junior. Si el proyecto escalara a auth/roles, migraría a TanStack Query.

## 3. Tecnologías y por qué

| Decisión | Alternativas descartadas | Justificación |
|---|---|---|
| **Node.js + Express + TypeScript** | NestJS, Fastify, Python/Django | Recomendado por la prueba; Express es mínimo y explícito, ideal para mostrar que entiendes middleware, errores y routing sin magia. TypeScript aporta tipos en DTOs y servicios. |
| **Prisma + PostgreSQL** | TypeORM, Sequelize, Mongoose+Mongo | Prisma genera migraciones SQL versionadas, tipa `Ticket`/`TicketHistory` automáticamente y soporta transacciones (`prisma.$transaction`) para atomicidad estado+historial. Postgres aporta `mode: insensitive` en búsquedas, constraints de enums e índices. Puerto 5433 en host para no chocar con Postgres local; dentro de Docker usa `postgres:5432`. |
| **Zod** | Joi, Yup, class-validator | Zod infiere tipos TS (`z.infer`) de los schemas, valida query params con `coerce` (page/limit como string→number) y produce errores estructurados `{field, message}` que el middleware convierte en 400. Es el estándar moderno para DTOs. |
| **Swagger UI estático** | tsoa, decoradores | Un objeto OpenAPI en `docs/swagger.ts` es suficiente para documentar 8 endpoints sin acoplar el código a decoradores. Disponible en `/api-docs`. |
| **React + Vite + TS** | Vue 3 (recomendado), Next.js | El usuario pidió React explícitamente. Vite da HMR instantáneo y build rápido; TS evita errores de tipos entre `ticketApi` y componentes. |
| **Tailwind CSS 4 + Lucide + Sonner** | Bootstrap, MUI, custom CSS | Tailwind permite un dashboard pulido sin CSS files; Lucide da iconos consistentes; Sonner es el sistema de toasts (notificaciones in-app) que cubre el opcional de notificaciones sin backend extra (email/websockets sería over-engineering para 6h). |
| **Vitest + Supertest** | Jest | Vitest es nativo ESM, más rápido y compatible con TS sin babel. Supertest prueba la API real (Express + Prisma + Postgres) incluyendo reglas 422. |
| **Playwright** | Cypress, Testing Library | Pedido explícito; Playwright levanta backend+frontend vía `webServer`, prueba validaciones reales de inputs y el flujo crítico Crítica→Resuelta de punta a punta. |
| **Docker multi-stage** | Solo compose para DB | Dockerfiles optimizados (builder/runner, nginx para frontend, `prisma migrate deploy` al arrancar backend) permiten `docker compose up --build` y desplegar en cualquier máquina, que es lo que puntúa el opcional. |

## 4. Validaciones y DTOs: por qué en dos niveles

### 4.1 Backend con Zod (contratos estrictos)

```ts
// schemas/ticket.schema.ts
CreateTicketSchema = { title: min(5).max(120), description: min(10).max(1000),
  applicant: min(3).max(60), category: nativeEnum(Category), priority: nativeEnum(Priority) }
ChangeStatusSchema = { newStatus: nativeEnum(Status), responsible: min(3), observation: max(500).optional() }
TicketQuerySchema = { page: coerce.number().positive().default(1), limit: max(100).default(10),
  search: optional, category/priority/status: optional enums, sortBy/sortOrder con defaults }
```

**Por qué estos límites:**

- `title 5–120`: evita "No" o "A" como títulos y evita desbordar la tabla; 120 es legible en una fila.
- `description 10–1000`: fuerza contexto mínimo para que soporte pueda actuar; 1000 evita abuso.
- `applicant/responsible min(3)`: evita iniciales vacías; se pide nombre real para auditoría.
- `observation max(500)`: suficiente para describir una solución sin convertirse en bitácora.
- `limit max(100)`: protege la BD de `?limit=1000000`.
- `sortBy` whitelist (`createdAt, updatedAt, title, priority, status`): evita inyección de `orderBy` arbitrario en Prisma.

El middleware global traduce `ZodError → 400 {success:false, errors:[{field,message}]}` para que el frontend muestre mensajes por campo sin parsear strings.

### 4.2 Reglas semánticas separadas de la sintaxis

`businessRules.service.ts` no valida tipos, valida **significado**:

```ts
VALID_TRANSITIONS = { Pendiente: [En_progreso, Cancelada], En_progreso: [Resuelta, Cancelada],
  Resuelta: [], Cancelada: [] }
validateStatusTransition(actual, nuevo, prioridad, observación)
  → 400 si actual===nuevo
  → 422 mensajes específicos para Cancelada→En_progreso y Resuelta→En_progreso
  → 422 si transición no está en VALID_TRANSITIONS
  → 422 si prioridad===Critica && nuevo===Resuelta && !observación
```

**Por qué separar:** si mañana se permite `Resuelta → En_progreso` (reapertura), solo cambia `VALID_TRANSITIONS` y sus tests, sin tocar Zod ni SQL. Los mensajes son explícitos para que el evaluador vea qué regla falló.

### 4.3 Frontend espeja validaciones (UX, no seguridad)

`TicketFormModal.validate()` y `ChangeStatusModal` replican mínimos/máximos y la regla Crítica→Resuelta **antes** de llamar a la API para dar feedback instantáneo (bordes, textos rojos, toasts). La seguridad real sigue en el backend: Playwright demuestra que aunque el frontend bloquee, el backend también rechaza con 422.

## 5. Persistencia: por qué dos tablas + transacciones

```prisma
Ticket { id uuid, title, description, applicant, category, priority, status=PENDIENTE, createdAt, updatedAt, history[] }
TicketHistory { id uuid, ticketId FK cascade, previousStatus, newStatus, changedAt=now(), responsible, observation? }
@@index(status, priority, category, createdAt) + @@index(ticketId, changedAt)
```

- **UUIDs** en vez de autoincrementales: no exponen conteos y funcionan en distribuido.
- **Enums nativos de Postgres**: la BD rechaza valores inválidos aunque se salte Zod.
- **Transacción en `createTicket` y `changeStatus`**: `ticket.update + history.create` en un solo `$transaction`. Si falla el historial, se revierte el cambio de estado (atomicidad de auditoría).
- **Creación inicial**: todo ticket nace `Pendiente` con un historial `Pendiente→Pendiente` ("Creación inicial"), así `getTicketHistory` nunca está vacío y el timeline tiene punto de partida.
- **Edición bloqueada en Resuelta/Cancelada** (422): evita mutar tickets cerrados por error; solo se permite eliminar o consultar historial.
- **Búsqueda `contains + insensitive`** sobre título/descripción/solicitante con `OR`: cubre el "buscar solicitudes" sin necesidad de Full-Text Search para este volumen.

## 6. Testing: qué se prueba y por qué así

### Backend (19 tests, `npm test`)

- **8 unitarios** (`businessRules.test.ts`): cada transición permitida y cada prohibida, incluido Crítica sin/con observación. Son rápidos y documentan las reglas como especificación ejecutable.
- **11 integración** (`tickets.api.test.ts` con Supertest): health, listado paginado, stats, 400 por DTO inválido, ciclo de vida completo (crear Crítica → ver detalle+historial → Pendiente→En_progreso 200 → intentar Resuelta sin observación 422 → Resuelta con observación 200 → intentar reabrir 422 → historial con 3 entradas). Prueba la transacción real contra Postgres.

### Frontend (5 E2E, `npm run test:e2e`)

- Validación de vacíos, longitudes mínimas, creación y visibilidad en tabla, filtros por texto/categoría, y flujo crítico Crítica→Resuelta (error sin observación, éxito con observación).
- `playwright.config.ts` levanta **ambos** servidores (`../backend` en :4000 y frontend en :3000) con `workers: 1` para evitar condiciones de carrera entre tests que comparten la misma BD.

## 7. Supuestos y decisiones adicionales justificadas

1. **Eliminar vs cancelar:** la prueba dice "eliminar o cancelar". Se implementan ambas: `DELETE` borra físicamente (con confirmación) y `PATCH .../status → Cancelada` conserva auditoría. Se documenta para que el evaluador no lo vea como ambigüedad.
2. **`En_progreso → Cancelada` permitida** aunque no estaba explícita: es coherente (un ticket en curso puede cancelarse por duplicidad o por decisión del solicitante) y no viola ninguna regla prohibida.
3. **`Resuelta/Cancelada` no editables ni transicionables:** se decidió tratarlos como finales para garantizar inmutabilidad de auditoría. Cualquier intento devuelve 422 con mensaje claro.
4. **Notificaciones = Sonner toasts:** cubre el opcional sin infraestructura extra; email/websockets se descartaron por costo/beneficio en 6h.
5. **`impeccable` no instalado:** `npx impeccable install` falló (zip inválido en la skill). Se sustituyó por diseño manual con Tailwind + jerarquía tipográfica y micro-interacciones equivalentes.
6. **Puerto DB 5433 en host:** evita colisión con Postgres local (servicio `postgresql-x64-17` en :5432). Documentado en README y `.env.example`.

## 8. Cómo defenderlo en la revisión técnica

- **Muestra `/api-docs`:** crea un ticket, pásalo a En_progreso, intenta resolver un Crítico sin observación (422) y con observación (200).
- **Muestra el historial:** el timeline prueba atomicidad (cada cambio tiene responsable y fecha).
- **Explica `validateStatusTransition`:** es pura, sin I/O, y sus 8 tests son la especificación.
- **Explica Zod vs reglas:** Zod = "¿los datos tienen forma válida?", `businessRules` = "¿la transición tiene sentido de negocio?".
- **Si piden cambiar una regla** (ej. permitir `Cancelada → Pendiente`): solo se toca `VALID_TRANSITIONS` + 1 test, sin migrar BD.
