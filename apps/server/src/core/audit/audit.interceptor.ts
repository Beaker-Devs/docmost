import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import {
  AUDIT_ROUTES,
  AUDIT_SAFE_FIELDS,
  AuditRouteDef,
} from './audit.constants';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req: any = context.switchToHttp().getRequest();

    // only mutating routes on the allowlist are audited
    const route: AuditRouteDef | undefined =
      req?.method === 'POST' ? AUDIT_ROUTES[this.normalizePath(req.url)] : undefined;

    if (!route) {
      return next.handle();
    }

    // record only on a successful response
    return next.handle().pipe(
      tap({
        next: (response) => this.safeRecord(req, route, response),
      }),
    );
  }

  private safeRecord(req: any, route: AuditRouteDef, response: any) {
    try {
      const user = req?.user?.user;
      const workspace = req?.raw?.workspace ?? req?.user?.workspace;

      // enterprise-gated: only record for licensed workspaces, and only for
      // authenticated actors
      if (!user?.id || !workspace?.id || !workspace?.licenseKey) {
        return;
      }

      const body = req?.body ?? {};
      const resourceId =
        (route.resourceIdField && body[route.resourceIdField]) ||
        this.responseId(response) ||
        null;

      void this.auditService.record({
        workspaceId: workspace.id,
        userId: user.id,
        action: route.action,
        resourceType: route.resourceType,
        resourceId: resourceId ? String(resourceId) : null,
        detail: this.redact(body),
        ipAddress: this.clientIp(req),
        userAgent: req?.headers?.['user-agent']?.slice(0, 512) ?? null,
      });
    } catch {
      // never let auditing affect the request
    }
  }

  private normalizePath(url: string): string {
    return (url || '').split('?')[0].replace(/\/+$/, '') || '/';
  }

  private responseId(response: any): string | undefined {
    const data = response?.data ?? response;
    return data && typeof data === 'object' ? data.id : undefined;
  }

  private redact(body: Record<string, any>): Record<string, any> | null {
    const detail: Record<string, any> = {};
    for (const key of AUDIT_SAFE_FIELDS) {
      if (body[key] !== undefined && body[key] !== null) {
        detail[key] = body[key];
      }
    }
    return Object.keys(detail).length ? detail : null;
  }

  private clientIp(req: any): string | null {
    const fwd = req?.headers?.['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
    return req?.ip ?? req?.raw?.socket?.remoteAddress ?? null;
  }
}
