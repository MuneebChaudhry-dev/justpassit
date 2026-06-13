import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SheetFilePipe } from './sheet-file.pipe';
import { QuestionsService } from './questions.service';

// Questions are always addressed under their test.
@Controller('tests/:testId/questions')
@Roles('SUPERADMIN')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findForTest(@Param('testId', ParseUUIDPipe) testId: string) {
    return this.questionsService.findForTest(testId);
  }

  /** Parse + validate an uploaded sheet and return the preview (no DB write). */
  @Post('upload/preview')
  @UseInterceptors(FileInterceptor('file'))
  preview(
    @Param('testId', ParseUUIDPipe) testId: string,
    @UploadedFile(SheetFilePipe) file: Express.Multer.File,
  ) {
    // testId validated for a 404-friendly error path via the service on commit;
    // preview is pure parsing and doesn't need the test to exist.
    void testId;
    return this.questionsService.preview(file.buffer);
  }

  /** Commit a previously-previewed sheet: re-validates and replaces the question set. */
  @Post('upload/commit')
  @UseInterceptors(FileInterceptor('file'))
  commit(
    @Param('testId', ParseUUIDPipe) testId: string,
    @UploadedFile(SheetFilePipe) file: Express.Multer.File,
    @CurrentUser() user: RequestUser,
  ) {
    return this.questionsService.commit(testId, file.buffer, user.id);
  }
}
