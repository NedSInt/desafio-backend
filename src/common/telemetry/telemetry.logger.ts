import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class TelemetryLogger implements OnModuleDestroy {
  private readonly stream: fs.WriteStream;

  constructor() {
    const logPath = path.resolve(process.cwd(), 'logs', 'requests.log');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    this.stream = fs.createWriteStream(logPath, { flags: 'a' });
  }

  write(payload: Record<string, unknown>): void {
    this.stream.write(`${JSON.stringify(payload)}\n`);
  }

  onModuleDestroy(): void {
    this.stream.end();
  }
}
