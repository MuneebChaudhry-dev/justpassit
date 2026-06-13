import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma 7's generated client requires an explicit driver adapter (it rejects a
 * bare `new PrismaClient()`). This builds the Postgres adapter from DATABASE_URL,
 * so both the app (PrismaService) and the seed script construct the client the same way.
 */
export function createPrismaAdapter(
  connectionString = process.env.DATABASE_URL,
) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  return new PrismaPg({ connectionString });
}
