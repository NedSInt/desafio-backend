import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { randomUUID } from 'node:crypto';
import { TelemetryLogger } from './telemetry.logger';

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  constructor(private readonly telemetryLogger: TelemetryLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ url: string; method: string }>();
    const res = context.switchToHttp().getResponse<{ statusCode: number }>();
    const startedAt = process.hrtime.bigint();
    const cpuStart = process.cpuUsage();
    const requestId = randomUUID();

    return next.handle().pipe(
      finalize(() => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const cpuDiff = process.cpuUsage(cpuStart);
        const memory = process.memoryUsage();

        this.telemetryLogger.write({
          timestamp: new Date().toISOString(),
          requestId,
          method: req.method,
          route: req.url,
          statusCode: res.statusCode,
          durationMs: Number(durationMs.toFixed(2)),
          memoryRssMb: Number((memory.rss / 1024 / 1024).toFixed(2)),
          memoryHeapUsedMb: Number((memory.heapUsed / 1024 / 1024).toFixed(2)),
          cpuUserMs: Number((cpuDiff.user / 1000).toFixed(2)),
          cpuSystemMs: Number((cpuDiff.system / 1000).toFixed(2)),
        });
      }),
    );
  }
}
