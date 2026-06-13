import * as XLSX from 'xlsx';
import type { ParsedQuestion, PreviewRow, UploadPreview } from 'shared';

/**
 * Parses an uploaded Excel/CSV questions sheet into validated rows (AGENTS.md §7).
 * Pure and side-effect free so it can be unit-tested and reused by both the
 * preview and commit endpoints (commit always re-validates server-side).
 *
 * Expected columns (header match is case/space-insensitive):
 *   Index | Question | Option A | Option B | Option C | Option D | Option E | Answer | Reason
 */

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
type Letter = (typeof LETTERS)[number];

/** Normalize a header cell to a lookup key: lowercase, alphanumeric only. */
function headerKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Map normalized header → our field. Several spellings accepted.
const HEADER_ALIASES: Record<string, string> = {
  index: 'index',
  no: 'index',
  question: 'question',
  questiontext: 'question',
  optiona: 'optionA',
  a: 'optionA',
  optionb: 'optionB',
  b: 'optionB',
  optionc: 'optionC',
  c: 'optionC',
  optiond: 'optionD',
  d: 'optionD',
  optione: 'optionE',
  e: 'optionE',
  answer: 'answer',
  correct: 'answer',
  correctanswer: 'answer',
  reason: 'reason',
  explanation: 'reason',
};

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  // SheetJS cells are primitives or Date; format those explicitly and ignore
  // anything object-shaped (which would otherwise stringify to "[object Object]").
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (value instanceof Date) return value.toISOString();
  return '';
}

/** Build a field→value record for one sheet row using the header row. */
function mapRow(headers: string[], row: unknown[]): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((header, i) => {
    const field = HEADER_ALIASES[headerKey(header)];
    if (field) {
      out[field] = cellToString(row[i]);
    }
  });
  return out;
}

/**
 * Resolve the `Answer` cell to a letter A–E.
 * - If it's already a letter (A–E, any case) → use it.
 * - Otherwise treat it as full answer text and match (trimmed, case-insensitive)
 *   against the present options to recover the letter.
 * Returns null if it can't be resolved.
 */
function resolveAnswerLetter(
  answerRaw: string,
  options: Record<Letter, string | null>,
): Letter | null {
  const trimmed = answerRaw.trim();
  if (trimmed === '') return null;

  const upper = trimmed.toUpperCase();
  if ((LETTERS as readonly string[]).includes(upper)) {
    const letter = upper as Letter;
    // The chosen letter must actually have an option value.
    return options[letter] ? letter : null;
  }

  // Full-text match against the options.
  const match = LETTERS.find(
    (l) => options[l] && options[l].toLowerCase() === trimmed.toLowerCase(),
  );
  return match ?? null;
}

export function parseQuestionsSheet(buffer: Buffer): UploadPreview {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { rows: [], validCount: 0, errorCount: 0, totalRows: 0 };
  }
  const sheet = workbook.Sheets[firstSheetName];

  // Array-of-arrays so we control header handling explicitly.
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
  });
  if (matrix.length === 0) {
    return { rows: [], validCount: 0, errorCount: 0, totalRows: 0 };
  }

  const headers = matrix[0].map((h) => cellToString(h));
  const dataRows = matrix.slice(1);

  const rows: PreviewRow[] = dataRows.map((rawRow, idx) => {
    const rowNumber = idx + 2; // +1 for header, +1 for 1-based
    const mapped = mapRow(headers, rawRow);
    const errors: string[] = [];

    const questionText = mapped.question ?? '';
    const optionA = mapped.optionA ?? '';
    const optionB = mapped.optionB ?? '';
    const optionC = mapped.optionC ? mapped.optionC : null;
    const optionD = mapped.optionD ? mapped.optionD : null;
    const optionE = mapped.optionE ? mapped.optionE : null;
    const reason = mapped.reason ? mapped.reason : null;

    if (!questionText) errors.push('Question text is required');
    if (!optionA) errors.push('Option A is required');
    if (!optionB) errors.push('Option B is required');

    const options: Record<Letter, string | null> = {
      A: optionA || null,
      B: optionB || null,
      C: optionC,
      D: optionD,
      E: optionE,
    };
    const correctAnswer = resolveAnswerLetter(mapped.answer ?? '', options);
    if (!correctAnswer) {
      errors.push(
        'Answer must be a letter A–E (or text matching one of the options)',
      );
    }

    const data: ParsedQuestion | null =
      errors.length === 0 && correctAnswer
        ? {
            questionText,
            optionA,
            optionB,
            optionC,
            optionD,
            optionE,
            correctAnswer,
            reason,
          }
        : null;

    return { rowNumber, data, errors };
  });

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  return {
    rows,
    validCount,
    errorCount: rows.length - validCount,
    totalRows: rows.length,
  };
}
