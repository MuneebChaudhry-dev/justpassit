import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '../audit/audit.actions';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { parseQuestionsSheet } from './sheet-parser';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Questions for a test, in sheet order. */
  async findForTest(testId: string) {
    await this.ensureTestExists(testId);
    return this.prisma.question.findMany({
      where: { testId },
      orderBy: { orderNum: 'asc' },
    });
  }

  /** Parse-only preview — no DB writes. The UI shows this before committing. */
  preview(buffer: Buffer) {
    return parseQuestionsSheet(buffer);
  }

  /**
   * Commit an uploaded sheet. Re-parses server-side (never trusts the client),
   * refuses if the test is locked or any row is invalid, then replaces the
   * question set in a single transaction (replace-all while unlocked) and sets
   * Test.totalQuestions. Audited as TEST_UPLOADED.
   */
  async commit(testId: string, buffer: Buffer, actorId: string) {
    const test = await this.ensureTestExists(testId);

    if (test.isLocked) {
      throw new ForbiddenException(
        'This test is locked (it has attempts); its questions can no longer be changed.',
      );
    }

    const parsed = parseQuestionsSheet(buffer);
    if (parsed.totalRows === 0) {
      throw new BadRequestException('The sheet has no question rows.');
    }
    if (parsed.errorCount > 0) {
      throw new BadRequestException(
        `Cannot import: ${parsed.errorCount} row(s) have validation errors. Fix them and re-upload.`,
      );
    }

    const insertData = parsed.rows
      .map((r) => r.data)
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .map((d, i) => ({
        testId,
        questionText: d.questionText,
        optionA: d.optionA,
        optionB: d.optionB,
        optionC: d.optionC,
        optionD: d.optionD,
        optionE: d.optionE,
        correctAnswer: d.correctAnswer,
        reason: d.reason,
        orderNum: i + 1,
      }));

    // Replace-all + count update atomically.
    await this.prisma.$transaction([
      this.prisma.question.deleteMany({ where: { testId } }),
      this.prisma.question.createMany({ data: insertData }),
      this.prisma.test.update({
        where: { id: testId },
        data: { totalQuestions: insertData.length },
      }),
    ]);

    await this.audit.log({
      actorId,
      action: AuditAction.TEST_UPLOADED,
      entityType: 'Test',
      entityId: testId,
      metadata: { inserted: insertData.length },
    });

    return { inserted: insertData.length };
  }

  private async ensureTestExists(testId: string) {
    const test = await this.prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    return test;
  }
}
