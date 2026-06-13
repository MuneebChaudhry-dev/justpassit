import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtPayloadSchema } from 'shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../decorators/current-user.decorator';

/**
 * Validates the bearer token AND re-reads the user from the DB on every request.
 * This is deliberate (AGENTS.md §4): a user blocked after their token was issued
 * loses access on their very next request, not when the token expires.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: unknown): Promise<RequestUser> {
    const parsed = jwtPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: parsed.data.sub },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    // Blocked or deleted users are rejected live, regardless of a valid token.
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    return user;
  }
}
