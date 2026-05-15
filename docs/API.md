# HTTP API reference

Base URL: your backend origin (e.g. `http://localhost:5000`). The frontend sets this via `VITE_API_BASE_URL`.

Unless noted, endpoints require:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

JWTs are issued by `POST /api/auth/login` and must decode to payload with `role: "admin"` (see backend auth middleware).

---

## Enums (from Prisma schema)

| Enum | Values |
|------|--------|
| `Role` | `ADMIN`, `USER` |
| `UserStatus` | `ACTIVE`, `SUSPENDED` |
| `SubscriptionStatus` | `ACTIVE`, `CANCELED`, `FAILED` |
| `TicketStatus` | `OPEN`, `RESOLVED` |
| `TicketPriority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `ActorType` | `USER`, `ADMIN`, `SYSTEM` |
| `EntityType` | `USER`, `SUBSCRIPTION`, `TICKET`, `SYSTEM` |

Invalid filter values are ignored (not treated as errors).

---

## Auth

| Method | Path | Auth | Body | Success |
|--------|------|------|------|---------|
| `POST` | `/api/auth/login` | None | `{ "password": string }` | `200` `{ "token": string }` |

Errors: `400` if password missing; `401` if password does not match `ADMIN_PASSWORD`.

---

## Users (`/users`)

All routes use admin JWT.

| Method | Path | Query | Body | Response |
|--------|------|-------|------|----------|
| `GET` | `/users` | `status` (`ACTIVE` \| `SUSPENDED`), `role` (`ADMIN` \| `USER`), `cursor` (user id), `limit` (default 10) | — | `200` `{ "users": User[] }` |
| `GET` | `/users/stats` | — | — | `200` `{ "stats": { active, suspended, admins, users } }` |
| `GET` | `/users/:id` | — | — | `200` `{ "user": User }` or `404` |
| `PATCH` | `/users/:id` | — | `{ "status": UserStatus }` | `200` `{ "user": User }` |
| `PATCH` | `/users/bulk` | — | `{ "userIds": string[], "status": UserStatus }` | `200` `{ "updatedCount": number }` |

`User` includes fields such as `id`, `email`, `role`, `status`, `createdAt`, `lastLogin` (see Prisma model).

---

## Support tickets (`/tickets`)

| Method | Path | Query | Body | Response |
|--------|------|-------|------|----------|
| `GET` | `/tickets` | `status`, `priority`, `cursor` (ticket id), `limit` (default 10) | — | `200` `{ "tickets": SupportTicket[], "nextCursor": string \| null }` |
| `GET` | `/tickets/stats` | — | — | `200` `{ "stats": { open, resolved, urgent } }` |
| `GET` | `/tickets/:id` | — | — | `200` `{ "ticket": SupportTicket }` or `404` |
| `PATCH` | `/tickets/:id` | — | JSON fields to merge into ticket (e.g. `title`, `status`, `priority`) | `200` `{ "ticket": SupportTicket }` |
| `PATCH` | `/tickets/bulk` | — | `{ "ticketIds": string[], "status": TicketStatus }` | `200` `{ "updatedCount": { "count": number } }` (Prisma `updateMany` batch payload) |

`SupportTicket`: `id`, `userId`, `title`, `status`, `priority`, `createdAt`.

---

## Subscriptions (`/subscriptions`)

| Method | Path | Query | Body | Response |
|--------|------|-------|------|----------|
| `GET` | `/subscriptions` | `status`, `cursor` (subscriptions with `id` **greater than** this value are returned), `limit` (default 10) | — | `200` `{ "subscriptions": Subscription[] }` |
| `GET` | `/subscriptions/stats` | — | — | `200` `{ "stats": { active, canceled, failed } }` |
| `GET` | `/subscriptions/:id` | — | — | `200` `{ "subscription": Subscription }` or `404` |

`Subscription`: `id`, `userId`, `plan`, `price`, `status`, `createdAt`.

---

## Activity logs (`/activity`)

| Method | Path | Query | Body | Response |
|--------|------|-------|------|----------|
| `GET` | `/activity` | `actorType`, `entityType`, `cursor` (log id), `limit` (default 10) | — | `200` `{ "logs": ActivityLog[] }` |
| `GET` | `/activity/stats` | — | — | `200` `{ "stats": { last24h } }` (`last24h` = count in last 24 hours) |
| `GET` | `/activity/:id` | — | — | `200` `{ "log": ActivityLog }` or `404` |

`ActivityLog`: `id`, `actorType`, `actorId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`, `userId` (optional relation).

---

## Error shape

Typical error responses:

```json
{ "error": "Unauthorized" }
```

`401`: missing/invalid JWT. `403`: JWT valid but `role` is not `admin`. `500`: server errors with a generic `error` message in many handlers.
