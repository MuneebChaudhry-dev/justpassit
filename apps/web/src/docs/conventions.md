# Conventions

## Folder layout (`src/`)
- `routes/` — TanStack Router route files (one per route); tree assembled in `router.tsx`.
- `features/<domain>/` — feature folders (e.g. `auth`): API calls, hooks, components, context.
- `components/ui/` — shadcn/ui components (Mira preset). `components/layout/` — app chrome.
- `lib/` — cross-cutting helpers: `api.ts` (axios), `query.ts` (QueryClient),
  `auth-storage.ts` (token), `utils.ts` (`cn`).
- `docs/` — these docs.

## Server state & data fetching
- One axios instance: `lib/api.ts`. Request interceptor attaches the bearer token; response
  interceptor clears the token and redirects to `/login` on 401.
- Use **TanStack Query** for all server state (`lib/query.ts`). No other global state library
  (AGENTS.md §9) — local UI state stays in `useState`/context.
- API response bodies are parsed with the **shared Zod schemas** (`from 'shared'`) so the
  client and server can't drift. Example: `features/auth/api.ts`.

## Forms
React Hook Form + `zodResolver`, using the schema from `packages/shared`. See
`features/auth/login-form.tsx`. Surface submit errors with Sonner (`toast.error`).

## Auth
`features/auth/auth-context.tsx` holds the current user; `useAuth()` exposes
`{ user, isLoading, login, logout }`. Token persists in `localStorage` via `lib/auth-storage.ts`;
the user is bootstrapped on load from `GET /auth/me`.

## Theme
Tokens live in `src/index.css` (`:root` + `.dark`, OKLCH cream/olive/orange, Mira preset).
**Do not move them** (AGENTS.md §9). Use semantic classes (`bg-background`, `text-foreground`,
`bg-primary`, `border-border`, …) — never hard-coded colors.

## Imports
`@/*` → `src/*`. Shared types/schemas import `from 'shared'`. Icons from `@hugeicons/react`.
