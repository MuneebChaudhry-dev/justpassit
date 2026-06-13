import { createRoute } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/use-auth';
import { protectedRoute } from './protected';

export const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/dashboard',
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">
        Welcome, {user?.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You are signed in as {user?.role}. Role-specific dashboards arrive in the
        next phases.
      </p>
    </div>
  );
}
