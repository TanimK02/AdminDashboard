# AdminDashboard

Full-stack **Admin Dashboard** with an Express + Prisma (Postgres) backend and a Vite + React + TypeScript frontend.

## Repo structure

- `backend/`: Express API + Prisma (Postgres)
- `frontend/`: Admin UI (Vite + React + TS + Tailwind)

## Features

- **Admin auth**: password login -> JWT (Bearer token)
- **Users**: list, filter, update status, bulk update
- **Support tickets**: list, filter, edit, bulk update, cursor pagination
- **Subscriptions**: list, filter, pagination, detail view
- **Activity logs**: list, filter, pagination, detail view

## Requirements

- Node.js (recommended: **18+**)
- Postgres database (for Prisma)

## Backend setup

```bash
cd backend
npm install
```

Create a `backend/.env` file:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
JWT_SECRET=your_secret_here
ADMIN_PASSWORD=your_admin_password_here
PORT=5000
```

Run migrations (if needed) and start the server:

```bash
cd backend
npx prisma migrate deploy
npm run start
```

The API will run on `http://localhost:5000` by default.

### API routes (high level)

- `POST /api/auth/login`
- `GET /users`, `PATCH /users/:id`, `PATCH /users/bulk`
- `GET /tickets`, `PATCH /tickets/:id`, `PATCH /tickets/bulk`
- `GET /subscriptions`, `GET /subscriptions/:id`
- `GET /activity`, `GET /activity/:id`

## Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Start the dev server:

```bash
cd frontend
npm run dev
```

Open the app at `http://localhost:5173`.

## Notes

- The frontend stores the admin JWT in `localStorage` and sends it as `Authorization: Bearer <token>` on every request.
- If a request returns `401`, the frontend automatically logs out and redirects to `/login`.

