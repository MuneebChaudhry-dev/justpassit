import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Mirrors `createTestSchema` in packages/shared. */
export class CreateTestDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsInt()
  @Min(1, { message: 'Passing % must be at least 1' })
  @Max(100, { message: 'Passing % cannot exceed 100' })
  passingPct!: number;
}
