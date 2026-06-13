/**
 * Canonical audit action names (AGENTS.md §6 rule 9). Use these constants instead
 * of string literals so the set stays consistent and greppable.
 */
export const AuditAction = {
  TEST_CREATED: 'TEST_CREATED',
  TEST_UPDATED: 'TEST_UPDATED',
  TEST_DELETED: 'TEST_DELETED',
  TEST_UPLOADED: 'TEST_UPLOADED',
  PASSING_PCT_CHANGED: 'PASSING_PCT_CHANGED',
  // Added in later phases: ADMIN_CREATED, ACCESS_GRANTED, ACCESS_REVOKED, USER_BLOCKED, ...
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

/** Entity types referenced by audit rows. */
export type AuditEntityType =
  | 'Test'
  | 'User'
  | 'CandidateAccess'
  | 'AdminAssignment';
