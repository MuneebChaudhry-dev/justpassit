import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Mark a route as public so the globally-applied JwtAuthGuard skips it (e.g. login). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
