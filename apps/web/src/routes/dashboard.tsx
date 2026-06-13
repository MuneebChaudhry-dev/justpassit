import { createRoute, Link } from '@tanstack/react-router';
import { Task01Icon } from '@hugeicons/core-free-icons';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/layout/page-header';
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
      <PageHeader
        title={`Welcome, ${user?.name ?? ''}`}
        description={`You are signed in as ${user?.role}.`}
      />

      {user?.role === 'SUPERADMIN' && (
        <Link to="/tests" className="block max-w-sm">
          <Card className="transition-colors hover:ring-primary/30">
            <CardContent className="flex items-center gap-4">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon icon={Task01Icon} size={22} />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Tests</p>
                <p className="text-xs text-muted-foreground">
                  Create tests and upload questions
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
