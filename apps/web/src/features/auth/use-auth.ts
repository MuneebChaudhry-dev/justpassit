import { useContext } from 'react';
import { AuthContext } from './auth-context';

/** Access the current auth state. Must be used within <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
