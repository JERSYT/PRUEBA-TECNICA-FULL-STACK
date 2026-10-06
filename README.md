# Mesa de Ayuda — Gestión de Solicitudes de Soporte Tecnológico

Aplicación Full Stack para registrar y dar seguimiento a solicitudes internas de soporte (título, descripción, solicitante, categoría, prioridad, estado, fechas) con historial de auditoría, reglas de transición de estados, búsqueda, filtros, orden y paginación.

## Stack

- **Backend:** Node.js 22 + Express 4 + TypeScript + Prisma 5 + PostgreSQL 16 + Zod + Swagger UI
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS 4 + Lucide Icons + Sonner (toasts)
- **Tests:** Vitest + Supertest (backend, 19 tests) · Playwright (frontend E2E, 5 tests)
- **Infra:** Docker + Docker Compose (postgres + backend + frontend/nginx)

## Requisitos

- Node.js 22+, Docker Desktop, Git

## Puesta en marcha rápida (Docker — recomendado)

```bash
# 1. Clonar y entrar
git clone https://github.com/JERSYT/PRUEBA-TECNICA-FULL-STACK.git
cd "PRUEBA TECNICA"

# 2. Variables de entorno (los .env reales NO se versionan, usa los .example)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Ajusta DATABASE_URL si usas Docker: postgresql://postgres:postgrespassword@postgres:5432/soporte_tecnico_db?schema=public
# Nota: docker-compose usa puerto 5433 en host para no chocar con Postgres local.
# Dentro de la red Docker el backend usa postgres:5432 (ver docker-compose.yml).

# 3. Levantar todo
docker compose up --build -d

# 4. Abrir
# Frontend: http://localhost:3000
# Backend health: http://localhost:4000/health
# Swagger API docs: http://localhost:4000/api-docs
```

## Puesta en marcha local (sin Docker)

```bash
# Base de datos (levanta solo postgres del compose)
docker compose up -d postgres
# backend/.env debe apuntar a localhost:5433:
# DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5433/soporte_tecnico_db?schema=public"

# Backend
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run dev        # http://localhost:4000 (Swagger en /api-docs)

# Frontend (otra terminal)
cd frontend
npm install
npm run dev        # http://localhost:3000
```

## Variables de entorno

| Archivo | Variables |
|---|---|
| `backend/.env` (ver `backend/.env.example`) | `PORT`, `DATABASE_URL`, `NODE_ENV`, `NOTIFY_ENABLED`, `NOTIFY_FROM`, `NOTIFY_TO`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` |
| `frontend/.env` (ver `frontend/.env.example`) | `VITE_API_BASE_URL=http://localhost:4000/api` |

> Por seguridad los `.env` están en `.gitignore` y nunca se suben a GitHub. Solo se versionan los `.env.example`.

## Scripts útiles

```bash
# Backend
cd backend
npm run dev          # desarrollo con hot-reload
npm run build        # compila TypeScript a dist/
npm start            # producción (requiere build)
npm test             # Vitest: 23 tests (reglas + API + notificaciones)
npm run seed         # 6 tickets de ejemplo con historial
npx prisma studio    # explorador visual de la BD

# Frontend
cd frontend
npm run dev          # Vite en :3000
npm run build        # build producción
npm run test:e2e     # Playwright (levanta backend+frontend automáticamente)
npx playwright show-report
```

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/tickets?search=&category=&priority=&status=&sortBy=&sortOrder=&page=&limit=` | Listar con filtros, búsqueda, orden y paginación |
| GET | `/api/tickets/stats` | Contadores por estado para el dashboard |
| GET | `/api/tickets/:id` | Detalle + historial |
| POST | `/api/tickets` | Crear (valida con Zod) |
| PUT | `/api/tickets/:id` | Editar (bloqueado si Resuelta/Cancelada) |
| PATCH | `/api/tickets/:id/status` | Cambiar estado (máquina de estados + auditoría) |
| DELETE | `/api/tickets/:id` | Eliminar |
| GET | `/api/tickets/:id/history` | Bitácora cronológica |
| GET | `/api/notifications` | Últimos correos procesados (modo log/SMTP) |
| POST | `/api/notifications/test` | Correo de prueba con la configuración actual |
| GET | `/health` | Health check |
| GET | `/api-docs` | Swagger UI |

## Notificaciones

- **In-app:** toasts Sonner en el frontend (crear, actualizar, cambiar estado, eliminar).
- **Correo (Nodemailer):** al crear un ticket y al cambiar de estado se envía correo a `NOTIFY_TO`.
  - Sin `SMTP_HOST`: modo `log` (consola + `GET /api/notifications`, sin credenciales).
  - Con `SMTP_HOST/USER/PASS` (ej. Gmail con App Password o Mailtrap): envío SMTP real.
  - `NOTIFY_ENABLED=false` desactiva el envío sin tocar código. Los fallos SMTP nunca rompen el flujo (201/200 igual).

## Reglas de negocio (resumen)

- `Pendiente → En_progreso`, `Pendiente → Cancelada`, `En_progreso → Resuelta`, `En_progreso → Cancelada`.
- `Cancelada` y `Resuelta` son estados finales: no pueden volver a `En_progreso` ni reabrirse.
- Prioridad `Crítica → Resuelta` exige `observación` obligatoria.
- Cada cambio de estado crea un registro en `TicketHistory` (estado anterior, nuevo, fecha, responsable, observación) dentro de la misma transacción SQL.

## Decisiones técnicas y justificación

Ver **`DECISIONES_TECNICAS.md`** para el documento completo: arquitectura en capas, por qué Express+Prisma+Zod, por qué React+Vite+Tailwind, estrategia de validaciones/DTOs, diseño de la máquina de estados, testing y supuestos.

## Control de versiones

- Ramas `main` y `develop`, flujo GitFlow simplificado.
- `develop` acumula 6 commits; al final se hace merge `develop → main`.
- Ver historial con `git log --oneline --graph --all`.
