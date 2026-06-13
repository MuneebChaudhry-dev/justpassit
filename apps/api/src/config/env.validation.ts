import { z } from 'zod';

/**
 * Validated environment. ConfigModule runs this on boot via `validate`,
 * so a missing DATABASE_URL or JWT_SECRET fails fast at startup instead of
 * surfacing as a confusing runtime error later (AGENTS.md §10).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // Web origin allowed by CORS. Comma-separated list supported.
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Seed credentials for the initial SUPERADMIN (used by prisma/seed.ts).
  SEED_SUPERADMIN_EMAIL: z.string().email().optional(),
  SEED_SUPERADMIN_PASSWORD: z.string().min(8).optional(),
  SEED_SUPERADMIN_NAME: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
