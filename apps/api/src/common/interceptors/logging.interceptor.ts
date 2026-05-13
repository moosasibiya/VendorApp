import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const { method, path } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = ctx.switchToHttp().getResponse<Response>();
          this.logger.log(`${method} ${path} ${res.statusCode} +${Date.now() - start}ms`);
        },
        error: () => {
          this.logger.warn(`${method} ${path} ERROR +${Date.now() - start}ms`);
        },
      }),
    );
  }
}
