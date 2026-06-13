import { z } from 'zod';
import { roleSchema } from '../enums.js';

/**
 * Login request. A single `identifier` field is matched against `email`
 * (admins/superadmins) OR `username` (end users) on the server — the client
 * doesn't need to know which kind of account it is.
 */
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** The current user as exposed to the client — never includes the password hash. */
export const authUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email().nullable(),
  username: z.string().nullable(),
  role: roleSchema,
  isActive: z.boolean(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

/** Response from POST /auth/login. */
export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/** JWT payload shape. `sub` is the user id; role is carried for convenience only —
 *  authorization is still re-checked live against the DB in guards. */
export const jwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  role: roleSchema,
});
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
