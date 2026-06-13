import { createRoute, Outlet, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { ProtectedLayout } from '@/components/layout/protected-layout';

/**
 * Pathless layout route guarding everything inside it. The `beforeLoad` guard is
 * the route-level check; real authorization still happens server-side on each
 * request (AGENTS.md §4, §8) — this just keeps unauthenticated users off the UI.
 */
export const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_protected',
  beforeLoad: ({ context, location }) => {
    if (context.auth.isLoading) return;
    if (!context.auth.user) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: () => (
    <ProtectedLayout>
      <Outlet />
    </ProtectedLayout>
  ),
});
