import {
  authUserSchema,
  loginResponseSchema,
  type AuthUser,
  type LoginInput,
  type LoginResponse,
} from 'shared';
import { api } from '@/lib/api';

/** POST /auth/login — returns the JWT + user. Response is validated with the shared schema. */
export async function login(input: LoginInput): Promise<LoginResponse> {
  const { data } = await api.post('/auth/login', input);
  return loginResponseSchema.parse(data);
}

/** GET /auth/me — the live current user. Used to bootstrap the session from a stored token. */
export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get('/auth/me');
  return authUserSchema.parse(data);
}
