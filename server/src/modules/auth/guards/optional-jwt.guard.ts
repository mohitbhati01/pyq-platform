import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard: if a Bearer token is present it decodes it and sets req.user.
 * If no token or invalid token, the request still proceeds with req.user = undefined.
 * Use this on public endpoints that can show extra info when authenticated.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // Override handleRequest so a missing/invalid token does NOT throw, instead returns null
  handleRequest(_err: any, user: any) {
    return user || null;
  }
}
