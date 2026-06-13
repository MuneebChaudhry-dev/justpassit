import * as XLSX from 'xlsx';
import { parseQuestionsSheet } from './sheet-parser';

/** Build an .xlsx buffer from an array-of-arrays (header row + data rows). */
function toBuffer(matrix: unknown[][]): Buffer {
  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

const HEADER = [
  'Index',
  'Question',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'Option E',
  'Answer',
  'Reason',
];

describe('parseQuestionsSheet', () => {
  it('parses a valid row with a letter answer', () => {
    const buf = toBuffer([
      HEADER,
      [
        1,
        'Capital of France?',
        'Paris',
        'London',
        'Berlin',
        'Rome',
        '',
        'A',
        'Paris is the capital',
      ],
    ]);
    const result = parseQuestionsSheet(buf);
    expect(result.totalRows).toBe(1);
    expect(result.validCount).toBe(1);
    expect(result.errorCount).toBe(0);
    expect(result.rows[0].data).toMatchObject({
      questionText: 'Capital of France?',
      optionA: 'Paris',
      correctAnswer: 'A',
      optionC: 'Berlin',
      optionE: null,
      reason: 'Paris is the capital',
    });
  });

  it('resolves a full-text answer back to its letter (case-insensitive)', () => {
    const buf = toBuffer([
      HEADER,
      [1, '2+2?', 'Three', 'Four', '', '', '', 'four', ''],
    ]);
    const result = parseQuestionsSheet(buf);
    expect(result.validCount).toBe(1);
    expect(result.rows[0].data?.correctAnswer).toBe('B');
    expect(result.rows[0].data?.reason).toBeNull();
  });

  it('flags a row missing option B', () => {
    const buf = toBuffer([
      HEADER,
      [1, 'Q?', 'only A', '', '', '', '', 'A', ''],
    ]);
    const result = parseQuestionsSheet(buf);
    expect(result.errorCount).toBe(1);
    expect(result.rows[0].data).toBeNull();
    expect(result.rows[0].errors).toContain('Option B is required');
  });

  it('flags an unresolvable answer', () => {
    const buf = toBuffer([
      HEADER,
      [1, 'Q?', 'Paris', 'London', '', '', '', 'Madrid', ''],
    ]);
    const result = parseQuestionsSheet(buf);
    expect(result.errorCount).toBe(1);
    expect(result.rows[0].errors[0]).toMatch(/Answer must be a letter/);
  });

  it('rejects a letter answer whose option is empty', () => {
    // Answer "C" but option C is blank → unresolvable.
    const buf = toBuffer([HEADER, [1, 'Q?', 'A', 'B', '', '', '', 'C', '']]);
    const result = parseQuestionsSheet(buf);
    expect(result.errorCount).toBe(1);
  });

  it('handles a mix of valid and invalid rows with correct counts', () => {
    const buf = toBuffer([
      HEADER,
      [1, 'Good?', 'A', 'B', '', '', '', 'A', ''],
      [2, '', 'A', 'B', '', '', '', 'A', ''], // missing question
      [3, 'Also good', 'X', 'Y', 'Z', '', '', 'z', ''], // full-text → C
    ]);
    const result = parseQuestionsSheet(buf);
    expect(result.totalRows).toBe(3);
    expect(result.validCount).toBe(2);
    expect(result.errorCount).toBe(1);
    expect(result.rows[1].errors).toContain('Question text is required');
    expect(result.rows[2].data?.correctAnswer).toBe('C');
    // Row numbers are 1-based and account for the header row.
    expect(result.rows[0].rowNumber).toBe(2);
    expect(result.rows[2].rowNumber).toBe(4);
  });

  it('parses CSV content too (same code path via SheetJS)', () => {
    const csv =
      'Index,Question,Option A,Option B,Option C,Option D,Option E,Answer,Reason\n' +
      '1,Sky color?,Blue,Green,,,,A,Because physics\n';
    const result = parseQuestionsSheet(Buffer.from(csv, 'utf8'));
    expect(result.validCount).toBe(1);
    expect(result.rows[0].data?.correctAnswer).toBe('A');
  });

  it('returns an empty result for an empty sheet', () => {
    const buf = toBuffer([HEADER]);
    const result = parseQuestionsSheet(buf);
    expect(result.totalRows).toBe(0);
    expect(result.validCount).toBe(0);
  });
});
