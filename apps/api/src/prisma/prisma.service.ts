import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// The Prisma 7 client is generated as source under apps/api/generated/prisma
// (see `generator client` in schema.prisma). Import it by relative path.
import { PrismaClient } from '../../generated/prisma/client';
import { createPrismaAdapter } from './prisma-adapter';

/**
 * Wraps the generated PrismaClient as an injectable Nest provider.
 * Connecting on module init (and disconnecting on destroy) gives us a single
 * shared connection pool for the whole app instead of one per request.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Prisma 7 requires a driver adapter (see prisma-adapter.ts).
    super({ adapter: createPrismaAdapter() });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
