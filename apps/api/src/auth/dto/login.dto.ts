import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Mirrors `loginSchema` in packages/shared. The web app validates with the Zod
 * schema; the API validates here via the global ValidationPipe. Keep both in sync.
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username or email is required' })
  identifier!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}
