import type { ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';

/** Shared chrome for every authenticated page: top bar + content area. */
export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="font-semibold text-foreground">
              JustPassIt
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {user?.role === 'SUPERADMIN' && (
                <Link
                  to="/tests"
                  className="text-muted-foreground hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
                >
                  Tests
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-muted-foreground">
                {user.name}
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {user.role}
                </span>
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
