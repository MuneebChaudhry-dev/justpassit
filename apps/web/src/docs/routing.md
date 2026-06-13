# Routing

TanStack Router, **code-based**. Each route is a file under `src/routes/`; the tree is
assembled in `src/router.tsx`. (We use code-based routing — no file-based codegen plugin —
so the tree is explicit and there's no build step.)

## Route tree
```
__root              routes/__root.tsx       carries RouterContext { auth }
├─ /                routes/index.tsx        redirects → /dashboard (authed) or /login
├─ /login           routes/login.tsx        login page; redirects → /dashboard if already authed
└─ _protected       routes/protected.tsx    pathless guard + ProtectedLayout
   ├─ /dashboard    routes/dashboard.tsx    role-aware landing (placeholder)
   ├─ /tests        routes/tests.tsx        SuperAdmin: test list + create dialog
   └─ /tests/$testId routes/test-detail.tsx SuperAdmin: edit + questions + upload wizard
```

`/tests` and `/tests/$testId` additionally guard on role in `beforeLoad` (redirect non-SuperAdmins
to `/dashboard`). The `tests` feature lives in `src/features/tests/` (api + Query hooks + the
create/upload dialogs).

## How the guard works
- The router's `context.auth` (`{ user, isLoading }`) is injected by `RouterProvider` in
  `main.tsx`, sourced from `AuthProvider` React state.
- `main.tsx` calls `router.invalidate()` whenever `auth.user`/`auth.isLoading` changes, so
  `beforeLoad` guards re-run after login/logout.
- `_protected.beforeLoad` redirects to `/login` (with a `redirect` search param) when there's
  no user. `/login.beforeLoad` and `/index.beforeLoad` redirect authed users to `/dashboard`.
- Guards wait while `auth.isLoading` (the initial `/auth/me` bootstrap) is true.

> Route guards are UX only. **Real authorization is server-side on every request**
> (AGENTS.md §4, §8). A 401 from the API triggers the axios interceptor, which clears the
> token and sends the user to `/login`.

## Adding a protected page
Create `routes/<name>.tsx` exporting a route whose `getParentRoute` is `protectedRoute`,
then add it to `protectedRoute.addChildren([...])` in `router.tsx`.
