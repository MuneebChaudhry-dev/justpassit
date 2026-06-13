import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import type { JwtPayload, LoginResponse } from 'shared';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from './decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Resolve a login `identifier` to a user by email OR username, then verify the
   * password against the stored bcrypt hash. Returns null on any failure (we never
   * reveal whether it was the identifier or the password that was wrong).
   */
  async validateUser(
    identifier: string,
    password: string,
  ): Promise<RequestUser | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
    if (!user) {
      return null;
    }

    const passwordMatches = await compare(password, user.password);
    if (!passwordMatches) {
      return null;
    }

    // Strip the password hash before it leaves the service.
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };
  }

  /** Issue a signed JWT for an already-validated user. */
  login(user: RequestUser): LoginResponse {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      user,
    };
  }
}
