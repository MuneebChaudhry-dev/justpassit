import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB is plenty for a question sheet

// Accept .xlsx / .xls / .csv by extension. MIME types vary too much across
// browsers/OSes to rely on, so we check the extension and let SheetJS validate content.
const ALLOWED_EXT = /\.(xlsx|xls|csv)$/i;

/** Validates an uploaded questions sheet: present, right extension, under size limit. */
@Injectable()
export class SheetFilePipe implements PipeTransform<Express.Multer.File> {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('A file is required (field name "file").');
    }
    if (!ALLOWED_EXT.test(file.originalname)) {
      throw new BadRequestException(
        'Unsupported file type. Upload an .xlsx, .xls, or .csv file.',
      );
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('File too large (max 5 MB).');
    }
    return file;
  }
}
