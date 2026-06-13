import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import './index.css';
import { queryClient } from '@/lib/query';
import { router } from '@/router';
import { AuthProvider } from '@/features/auth/auth-context';
import { useAuth } from '@/features/auth/use-auth';

/**
 * Bridges the AuthProvider's React state into the router context so route
 * `beforeLoad` guards can see the live auth state. When auth changes we
 * invalidate the router so guards re-run (e.g. redirect after login/logout).
 */
function App() {
  const auth = useAuth();

  useEffect(() => {
    void router.invalidate();
  }, [auth.user, auth.isLoading]);

  return <RouterProvider router={router} context={{ auth }} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  </StrictMode>,
);
