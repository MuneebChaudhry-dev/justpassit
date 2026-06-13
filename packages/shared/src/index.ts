/**
 * `shared` — the single source of truth for request/response shapes used by
 * BOTH apps/web (form validation) and apps/api (request validation).
 * Keep this in sync with the Prisma schema; never let the two drift.
 */
export * from './enums.js';
export * from './schemas/auth.js';
