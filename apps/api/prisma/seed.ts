import 'dotenv/config';
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Idempotent seed: ensures exactly one SUPERADMIN exists, created from env.
 * Safe to run repeatedly — it upserts by email and never stores plaintext.
 */
const prisma = new PrismaClient({
  // Prisma 7 requires a driver adapter.
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = process.env.SEED_SUPERADMIN_EMAIL;
  const password = process.env.SEED_SUPERADMIN_PASSWORD;
  const name = process.env.SEED_SUPERADMIN_NAME ?? 'Super Admin';

  if (!email || !password) {
    console.warn(
      'Skipping SUPERADMIN seed: set SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD in .env',
    );
    return;
  }

  const passwordHash = await hash(password, 10);

  const superadmin = await prisma.user.upsert({
    where: { email },
    update: {}, // don't clobber an existing account's password on re-seed
    create: {
      name,
      email,
      password: passwordHash,
      role: 'SUPERADMIN',
      isActive: true,
    },
  });

  console.log(`SUPERADMIN ready: ${superadmin.email} (${superadmin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
