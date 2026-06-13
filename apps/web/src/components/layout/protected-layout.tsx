import type { ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  DashboardSquare01Icon,
  Logout03Icon,
  Task01Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import type { Role } from 'shared';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/features/auth/use-auth';
import logo from '@/assets/logo.png';

interface NavItem {
  label: string;
  to: string;
  icon: IconSvgElement;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: DashboardSquare01Icon,
    roles: ['SUPERADMIN', 'ADMIN', 'ENDUSER'],
  },
  { label: 'Tests', to: '/tests', icon: Task01Icon, roles: ['SUPERADMIN'] },
];

/** App chrome: fixed left sidebar + scrollable main content. */
export function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-2 px-5">
          <img src={logo} alt="JustPassIt" className="h-8 w-auto" />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {visibleItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-sidebar-primary [&.active]:text-sidebar-primary-foreground"
            >
              <Icon icon={item.icon} size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Icon icon={Logout03Icon} size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="ml-60 flex-1">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
