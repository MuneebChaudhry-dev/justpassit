import { createRoute, redirect, useNavigate } from '@tanstack/react-router';
import { LoginForm } from '@/features/auth/login-form';
import logo from '@/assets/logo.png';
import { Route as rootRoute } from './__root';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  // Already signed in? Skip the form.
  beforeLoad: ({ context }) => {
    if (!context.auth.isLoading && context.auth.user) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      {/* Soft brand glow behind the card */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-2xl -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-7 shadow-lg shadow-foreground/5 sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <img src={logo} alt="JustPassIt" className="mb-4 h-12 w-auto" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your JustPassIt account
            </p>
          </div>
          <LoginForm onSuccess={() => navigate({ to: '/dashboard' })} />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Private platform · access by invitation only
        </p>
      </div>
    </div>
  );
}
