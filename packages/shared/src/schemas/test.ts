import { z } from 'zod';

/** Passing percentage is a whole number 1–100. */
export const passingPctSchema = z
  .number()
  .int()
  .min(1, 'Passing % must be at least 1')
  .max(100, 'Passing % cannot exceed 100');

/** Create a test (SuperAdmin). */
export const createTestSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().trim().max(2000).optional(),
  passingPct: passingPctSchema,
});
export type CreateTestInput = z.infer<typeof createTestSchema>;

/**
 * Update a test. All fields optional. The server additionally enforces that once a
 * test is locked (first attempt made), `passingPct` cannot change — only name,
 * description, and isActive may be edited.
 */
export const updateTestSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  passingPct: passingPctSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateTestInput = z.infer<typeof updateTestSchema>;

/** A test as returned to the client. */
export const testSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  passingPct: z.number().int(),
  totalQuestions: z.number().int(),
  isActive: z.boolean(),
  isLocked: z.boolean(),
  createdBy: z.string().uuid(),
  createdAt: z.string(), // ISO string over the wire
  updatedAt: z.string(),
});
export type Test = z.infer<typeof testSchema>;

export const testListSchema = z.array(testSchema);
