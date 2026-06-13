import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthUser, LoginInput } from 'shared';
import { clearToken, getToken, setToken } from '@/lib/auth-storage';
import { fetchMe, login as loginRequest } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean; // true only during the initial session bootstrap
  login: (input: LoginInput) => Promise<AuthUser>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  // Only "loading" if there's a token to resolve; otherwise we already know we're logged out.
  const [isLoading, setIsLoading] = useState(() => !!getToken());

  // On first load, if a token is present, resolve the live user. A blocked/expired
  // user will 401 here and be treated as logged out (the axios interceptor clears the token).
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const { accessToken, user: loggedIn } = await loginRequest(input);
    setToken(accessToken);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
