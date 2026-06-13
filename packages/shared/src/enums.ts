import { z } from 'zod';

/**
 * Single source of truth for the role/attempt enums.
 * These MUST mirror the Prisma enums in apps/api/prisma/schema.prisma exactly —
 * same string values — so the frontend and backend never disagree about a role
 * or an attempt's mode/status.
 */

export const roleSchema = z.enum(['SUPERADMIN', 'ADMIN', 'ENDUSER']);
export type Role = z.infer<typeof roleSchema>;

export const attemptModeSchema = z.enum(['FULL', 'PRACTICE']);
export type AttemptMode = z.infer<typeof attemptModeSchema>;

export const attemptStatusSchema = z.enum(['IN_PROGRESS', 'COMPLETED']);
export type AttemptStatus = z.infer<typeof attemptStatusSchema>;

/** Allowed answer letters. C/D/E are optional on a question (true/false uses A/B). */
export const answerLetterSchema = z.enum(['A', 'B', 'C', 'D', 'E']);
export type AnswerLetter = z.infer<typeof answerLetterSchema>;
