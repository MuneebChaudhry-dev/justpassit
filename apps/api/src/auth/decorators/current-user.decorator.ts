import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Role } from 'shared';

/**
 * The authenticated user attached to the request by JwtStrategy.validate().
 * This is the LIVE user row (minus the password), re-read from the DB on every
 * request — never just the decoded token (AGENTS.md §4).
 */
export interface RequestUser {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  role: Role;
  isActive: boolean;
}

/** Inject the current user into a controller handler param. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as RequestUser;
  },
);

// Note: `RequestUser` above is exported as a type; Express.Request.user is
// augmented to this shape in src/types/express.d.ts.
