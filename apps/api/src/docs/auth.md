# Auth flow

## Roles
`SUPERADMIN`, `ADMIN`, `ENDUSER` (see `packages/shared` `roleSchema`, mirrors the Prisma enum).
- Admins/superadmins log in with **email**; end users log in with **username**. The login
  endpoint takes a single `identifier` field and resolves it against either column.

## Login → JWT
1. `POST /auth/login` is `@Public()` and guarded by `LocalAuthGuard` (passport-local with
   `usernameField: 'identifier'`).
2. `LocalStrategy.validate` → `AuthService.validateUser(identifier, password)`:
   finds an **active** user by email OR username, then `bcrypt.compare` against the stored hash.
   Returns the user (without the password hash) or `null` → 401.
3. `AuthController.login` signs a JWT (`{ sub: userId, role }`) via `@nestjs/jwt`
   (`JWT_SECRET`, `JWT_EXPIRES_IN`) and returns `{ accessToken, user }`.

> Note: because `LocalAuthGuard` runs before the `ValidationPipe` body check, a malformed
> login body returns **401** (not 400). This is intentional for the login route — we don't
> reveal which field was wrong.

## Protected requests → live checks (AGENTS.md §4)
- `JwtAuthGuard` (global) requires a bearer token unless the route is `@Public()`.
- `JwtStrategy.validate` decodes the token, then **re-reads the user from the DB on every
  request** and rejects if missing or `isActive === false`. A user blocked after their token
  was issued loses access on their **next** request — verified: same token returns 401 once
  blocked, 200 again once unblocked.
- `RolesGuard` (global) checks `@Roles(...)` metadata against the live user's role.
- `@CurrentUser()` injects the live `RequestUser` into handlers. Express's `Request.user` is
  typed via `src/types/express.d.ts`.

## Decorators & guards (where they live)
- `src/auth/decorators/` — `@Public()`, `@Roles()`, `@CurrentUser()`
- `src/auth/guards/` — `JwtAuthGuard`, `LocalAuthGuard`, `RolesGuard`
- `src/auth/strategies/` — `jwt.strategy.ts`, `local.strategy.ts`

## Data scoping (coming with the feature modules)
Role gating is the coarse layer. Per AGENTS.md §8, ownership (e.g. an Admin only seeing their
own rows) is enforced in the **service/query layer**, not by route guards alone.
