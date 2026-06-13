import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { AuthUser } from 'shared';

/**
 * Router context carries the live auth state so route `beforeLoad` guards can
 * redirect without reading React state. main.tsx injects the real value and
 * re-renders the RouterProvider whenever auth changes.
 */
export interface RouterContext {
  auth: {
    user: AuthUser | null;
    isLoading: boolean;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return <Outlet />;
}
