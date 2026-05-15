# Backend (Express + Prisma)

JSON API for the admin dashboard. Entry point: [index.js](index.js).

## Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run start` | Run API with `node --watch index.js` (restarts on file changes) |
| `npm run dev` | Run with `nodemon index.js` |
| `npm run seed` | Populate the database with sample data ([seed.js](seed.js)) |
| `npm test` | Run Jest tests (`NODE_OPTIONS=--experimental-vm-modules` is set in the script) |

## Prisma

- Schema: [prisma/schema.prisma](prisma/schema.prisma) (PostgreSQL).
- Client output directory: `generated/prisma` (not `node_modules`). After install or schema changes:

```bash
npx prisma generate
```

- **New database / first clone:** apply migrations.

```bash
npx prisma migrate dev    # development: creates DB if needed, applies migrations
# or
npx prisma migrate deploy # CI/production: apply existing migrations only
```

## Environment

Copy [.env.example](.env.example) to `.env` and set:

- `DATABASE_URL` — PostgreSQL URL (must match the `postgresql` provider in the schema).
- `JWT_SECRET` — secret for signing JWTs.
- `ADMIN_PASSWORD` — password accepted by `POST /api/auth/login`.
- `PORT` — optional; defaults to `5000`.

Do not commit `.env`.

## Seeding

```bash
npm run seed
```

Requires a valid `DATABASE_URL` and generated client. Useful for local demos and for integration tests (Jest global setup imports the seed).

## Tests

```bash
npm test
```

- Jest config lives in [package.json](package.json) under the `"jest"` key (`testEnvironment: "node"`).
- [tests/setup.js](tests/setup.js) runs once before tests and executes the seed so routes have data.
- Ensure `DATABASE_URL`, `JWT_SECRET`, and `ADMIN_PASSWORD` are available when tests run (for example via `backend/.env`). The Prisma schema targets **PostgreSQL**; your `DATABASE_URL` must use that provider.

Some test files import the Express `app` from `index.js`; today `index.js` starts `listen()` and does not export `app`. If tests fail on import or try to bind the port twice, refactor the server into a small `app.js` that exports `app` and an optional `listen()` for production (outside the scope of this doc).

## API reference

See [docs/API.md](../docs/API.md) in the repo root for routes, query parameters, and bodies.
