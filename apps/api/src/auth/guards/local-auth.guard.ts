import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Triggers the local strategy (identifier + password) on the login route. */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
