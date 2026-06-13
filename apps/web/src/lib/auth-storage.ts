/**
 * Single place that knows where the JWT lives. The axios interceptor reads it,
 * the auth provider writes it. Kept tiny on purpose — no global state library
 * (AGENTS.md §9); React holds the user, localStorage holds the token across reloads.
 */
const TOKEN_KEY = 'justpassit.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
