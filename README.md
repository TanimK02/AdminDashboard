# Admin Dashboard

Full-stack admin console: **Express + Prisma (PostgreSQL)** API and a **Vite + React + TypeScript** web UI (Tailwind, TanStack Query).

Use this repo as the single entry point. Backend-specific steps live in [backend/README.md](backend/README.md). Full HTTP details are in [docs/API.md](docs/API.md). High-level system layout is in [docs/architecture.md](docs/architecture.md).

## Features

- **Authentication**: shared admin password → JWT (`Bearer` token)
- **Users**: list, filters, cursor pagination, single user, status update, bulk status update, aggregate stats
- **Support tickets**: list, filters, cursor pagination with `nextCursor`, edit, bulk status update, stats
- **Subscriptions**: list, filter, cursor-style pagination (by subscription id), detail, stats
- **Activity logs**: list, filters, cursor pagination, detail, stats (last 24h count)

## Requirements

- **Node.js** 18+
- **PostgreSQL** (Prisma datasource is PostgreSQL)

## Quick start

### 1. Database and backend

```bash
cd backend
npm install
npx prisma generate
cp .env.example .env   # then edit .env with your real DATABASE_URL and secrets
npx prisma migrate deploy   # or: npx prisma migrate dev  (local development)
npm run seed                # optional: sample data
npm run start               # API on http://localhost:5000 by default
```

Prisma generates the client into `backend/generated/prisma` (see [backend/prisma/schema.prisma](backend/prisma/schema.prisma)). Run `npx prisma generate` after install or whenever the schema changes.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # set VITE_API_BASE_URL to your API origin
npm run dev                 # UI on http://localhost:5173
```

Set `VITE_API_BASE_URL` to the backend origin (no trailing slash required for how the client builds URLs). Example: `http://localhost:5000`.

## Environment variables

| Location | Variable | Purpose |
|----------|----------|---------|
| Backend | `DATABASE_URL` | PostgreSQL connection string for Prisma |
| Backend | `JWT_SECRET` | Secret used to sign and verify admin JWTs |
| Backend | `ADMIN_PASSWORD` | Plain-text password checked on `POST /api/auth/login` |
| Backend | `PORT` | API port (default `5000`) |
| Frontend | `VITE_API_BASE_URL` | Base URL for API requests |

Templates: [backend/.env.example](backend/.env.example), [frontend/.env.example](frontend/.env.example).

## API overview

- **Auth (no JWT):** `POST /api/auth/login` — body `{ "password": "..." }` → `{ "token": "..." }`.
- **All other routes** require header `Authorization: Bearer <token>`.

Path prefix: everything except login is mounted at the paths below (not under `/api`).

| Area | Base path | Notes |
|------|-----------|--------|
| Users | `/users` | Includes `GET /users/stats` |
| Tickets | `/tickets` | List returns `nextCursor` when more pages exist |
| Subscriptions | `/subscriptions` | Cursor is “last seen id” (`id` greater than cursor) |
| Activity | `/activity` | |

Full route list, query parameters, and response shapes: **[docs/API.md](docs/API.md)**.

## Frontend behavior

- JWT is stored in `localStorage` as `admin_token` and sent as `Authorization: Bearer <token>`.
- Responses with **401** clear the token and redirect to `/login`.

## Security notes

- A single shared `ADMIN_PASSWORD` is suitable for demos only; production systems should use proper identity providers and user accounts.
- JWT in `localStorage` is convenient for a dashboard but is vulnerable to XSS; keep dependencies patched and avoid injecting untrusted HTML.

## Troubleshooting

- **Prisma errors after clone:** run `cd backend && npx prisma generate` and ensure `DATABASE_URL` points at a reachable PostgreSQL instance.
- **401 on every request:** wrong or missing `JWT_SECRET` between login and verify, expired token (default expiry 1 day), or missing `Bearer` prefix.
- **CORS:** backend uses `cors()` with default settings; for production, restrict origins to your UI host.

## Repository layout

| Path | Role |
|------|------|
| [backend/](backend/) | Express API, Prisma, Jest tests, seed script |
| [frontend/](frontend/) | Vite + React admin UI |
| [docs/](docs/) | API reference and architecture notes |
