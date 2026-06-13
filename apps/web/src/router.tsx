import { createRouter } from '@tanstack/react-router';
import { Route as rootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { loginRoute } from './routes/login';
import { protectedRoute } from './routes/protected';
import { dashboardRoute } from './routes/dashboard';

// Compose the route tree. Protected pages nest under the pathless guard route.
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  protectedRoute.addChildren([dashboardRoute]),
]);

export const router = createRouter({
  routeTree,
  // Real context is injected by RouterProvider in main.tsx; this is just the default.
  context: { auth: { user: null, isLoading: true } },
  defaultPreload: 'intent',
});

// Type-safety for the router across the app.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
