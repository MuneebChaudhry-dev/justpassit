import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Role } from 'shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Checks the live user's role (set by JwtStrategy) against the @Roles() metadata.
 * Routes without @Roles() are allowed for any authenticated user.
 * Note: role gating is the coarse layer — data scoping (e.g. "admin sees only
 * their own rows") is enforced separately in the service layer (AGENTS.md §8).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user || !required.some((role) => role === user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
