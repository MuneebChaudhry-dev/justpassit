import { createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';

/**
 * "/" just routes the user to the right place: dashboard if authed, login if not.
 * Wait for the session bootstrap to finish before deciding.
 */
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) return;
    throw redirect({ to: context.auth.user ? '/dashboard' : '/login' });
  },
});
