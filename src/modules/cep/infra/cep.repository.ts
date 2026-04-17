import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { CepRecord } from './cep.types';

@Injectable()
export class CepRepository implements OnModuleInit {
  private readonly cepByCode = new Map<string, CepRecord>();
  private readonly records: CepRecord[] = [];

  async onModuleInit(): Promise<void> {
    const dataFile = path.resolve(process.cwd(), 'data', 'ceps-geocoded.ndjson');
    await this.loadFromNdjson(dataFile);
  }

  getByCep(cep: string): CepRecord | undefined {
    return this.cepByCode.get(cep);
  }

  getAll(): readonly CepRecord[] {
    return this.records;
  }

  private async loadFromNdjson(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) {
        continue;
      }
      const parsed = JSON.parse(line) as CepRecord;
      if (!Number.isFinite(parsed.latitude) || !Number.isFinite(parsed.longitude)) {
        continue;
      }
      this.records.push(parsed);
      this.cepByCode.set(parsed.cep, parsed);
    }
  }
}
