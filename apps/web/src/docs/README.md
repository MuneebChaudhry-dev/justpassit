# JustPassIt Web — Documentation

Living docs for the React SPA. Update these in the same change that adds or changes a route,
feature folder, or convention (AGENTS.md §8).

## Index
- [routing.md](./routing.md) — the route tree and how guards/redirects work.
- [conventions.md](./conventions.md) — folder layout, data fetching, theme, components.

## Stack (locked — AGENTS.md §2)
React 19 + Vite + TypeScript · TanStack Router (code-based, files under `src/routes/`) ·
TanStack Query (server state) · React Hook Form + Zod (`@hookform/resolvers`) · Axios ·
shadcn/ui (Mira preset) + Tailwind v4 · Sonner toasts.

> Icons: **`@hugeicons/react`** (the repo's installed/configured library). AGENTS.md §2 lists
> lucide, but the project standardizes on hugeicons (`components.json` `iconLibrary: hugeicons`).

## Running locally
```
# from apps/web
yarn dev     # vite (http://localhost:5173)
```
Requires the API running at `VITE_API_URL` (default `http://localhost:3001`). Set in `.env`.
