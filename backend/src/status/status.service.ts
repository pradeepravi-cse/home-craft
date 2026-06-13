import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface AppStatus {
  status: 'ok' | 'degraded';
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: 'up' | 'down';
}

@Injectable()
export class StatusService {
  // package.json sits at process.cwd() both in local dev (backend/) and in
  // the Docker image (/app) — read once at boot, version never changes at runtime
  private readonly version: string = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
  ).version;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getStatus(): Promise<AppStatus> {
    let database: 'up' | 'down' = 'up';
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      version: this.version,
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database,
    };
  }
}
