import { z } from 'zod';
import { answerLetterSchema } from '../enums.js';

/** A question as returned to the client (ordered by orderNum within its test). */
export const questionSchema = z.object({
  id: z.string().uuid(),
  testId: z.string().uuid(),
  questionText: z.string(),
  optionA: z.string(),
  optionB: z.string(),
  optionC: z.string().nullable(),
  optionD: z.string().nullable(),
  optionE: z.string().nullable(),
  correctAnswer: answerLetterSchema,
  reason: z.string().nullable(),
  orderNum: z.number().int(),
});
export type Question = z.infer<typeof questionSchema>;

export const questionListSchema = z.array(questionSchema);

/**
 * One parsed row from an uploaded Excel/CSV sheet. `data` is the normalized,
 * insert-ready question (without testId/orderNum, which the server assigns) when
 * the row is valid; `errors` lists per-row validation problems when it isn't.
 */
export const parsedQuestionSchema = z.object({
  questionText: z.string(),
  optionA: z.string(),
  optionB: z.string(),
  optionC: z.string().nullable(),
  optionD: z.string().nullable(),
  optionE: z.string().nullable(),
  correctAnswer: answerLetterSchema,
  reason: z.string().nullable(),
});
export type ParsedQuestion = z.infer<typeof parsedQuestionSchema>;

export const previewRowSchema = z.object({
  rowNumber: z.number().int(), // 1-based row index from the sheet (for error messages)
  data: parsedQuestionSchema.nullable(),
  errors: z.array(z.string()),
});
export type PreviewRow = z.infer<typeof previewRowSchema>;

/** Response of the upload PREVIEW endpoint — what the UI renders before committing. */
export const uploadPreviewSchema = z.object({
  rows: z.array(previewRowSchema),
  validCount: z.number().int(),
  errorCount: z.number().int(),
  totalRows: z.number().int(),
});
export type UploadPreview = z.infer<typeof uploadPreviewSchema>;
