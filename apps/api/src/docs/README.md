# JustPassIt API — Documentation

Living docs for the NestJS backend. Update these in the same change that adds or
changes an endpoint, guard, or audit action (AGENTS.md §8).

## Index
- [endpoints.md](./endpoints.md) — every endpoint: method, path, role, request, response.
- [auth.md](./auth.md) — the auth flow, guards, and how live access checks work.
- Audit actions — tracked in [endpoints.md](./endpoints.md) as they land (none yet in Phase 0).

## Architecture at a glance
- **Modular monolith.** One module per domain under `src/` (`auth`, `prisma`, and the
  feature modules added per phase: `tests`, `questions`, `assignments`, `access`,
  `attempts`, `audit`, `users`).
- **Prisma 7** with the generated client in `apps/api/generated/prisma` (CJS, `nodejs`
  runtime — see schema generator block). `PrismaService` (global) constructs the client
  with the `@prisma/adapter-pg` driver adapter, which Prisma 7 requires.
- **Config** validated on boot by `src/config/env.validation.ts` (Zod). Missing
  `DATABASE_URL`/`JWT_SECRET` fails fast.
- **Global pipes/guards** (registered in `app.module.ts` / `main.ts`):
  - `ValidationPipe` — `whitelist`, `forbidNonWhitelisted`, `transform`.
  - `JwtAuthGuard` (APP_GUARD) — every route requires a JWT unless marked `@Public()`.
  - `RolesGuard` (APP_GUARD) — enforces `@Roles(...)`; routes without it allow any authed user.
  - CORS — allows the `CORS_ORIGIN` list (web origin).

## Running locally
```
# from apps/api
npx prisma migrate dev      # apply migrations
npx prisma db seed          # create the SUPERADMIN from .env
yarn dev                    # nest start --watch (http://localhost:3001)
```
Seed credentials come from `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` in `.env`.
