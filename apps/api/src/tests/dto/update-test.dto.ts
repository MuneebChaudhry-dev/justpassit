import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Mirrors `updateTestSchema`. All fields optional. The lock rule (no passingPct
 * change once locked; only name/description/isActive allowed) is enforced in the
 * service, not here.
 */
export class UpdateTestDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  passingPct?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
