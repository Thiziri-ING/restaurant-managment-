import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private eventEmitter: EventEmitter2) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, ip } = request;

    const mutateMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutateMethods.includes(method)) return next.handle();

    const before = { ...body };

    return next.handle().pipe(
      tap((responseData) => {
        if (!user?.sub) return;

        this.eventEmitter.emit('audit.log', {
          userId: user.sub,
          action: this.resolveAction(method),
          resource: this.resolveResource(url),
          resourceId: responseData?.id ?? null,
          oldValue: method === 'DELETE' ? before : null,
          newValue: ['POST', 'PUT', 'PATCH'].includes(method) ? responseData : null,
          ip: ip ?? null,
        });
      }),
    );
  }

  private resolveAction(method: string): string {
    const map: Record<string, string> = {
      POST: 'created',
      PUT: 'updated',
      PATCH: 'updated',
      DELETE: 'deleted',
    };
    return map[method] ?? 'unknown';
  }

  private resolveResource(url: string): string {
    // /api/orders/123 → orders
    const parts = url.replace(/^\/api\//, '').split('/');
    return parts[0] ?? 'unknown';
  }
}
