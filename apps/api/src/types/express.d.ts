import type { RequestUser } from '../auth/decorators/current-user.decorator';

// Passport binds `request.user` to the `Express.User` interface. We extend it
// with our RequestUser so `request.user` is correctly typed everywhere under
// strict mode. (Must be an interface to merge with passport's declaration; the
// empty-interface lint rule doesn't apply to this augmentation pattern.)
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends RequestUser {}
  }
}

export {};
