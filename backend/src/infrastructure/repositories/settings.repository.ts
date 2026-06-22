import { Injectable } from '@nestjs/common';
import { PostgresDatabase } from '../persistence/database.js';
import type { SettingsRepository, AutoActionGlobal } from '../../application/ports/settings.repository.js';

@Injectable()
export class PostgresSettingsRepository implements SettingsRepository {
  constructor(private readonly database: PostgresDatabase) {}

  async getAutoActionGlobal(): Promise<AutoActionGlobal | null> {
    const db = this.database.getDb();
    const res = await db.select().from({ t: db.raw('kb_auto_action_global') }).limit(1) as any;
    // Using raw select since Drizzle mapping here is extra work; fallback to simple pool query
    if (!res || res.length === 0) {
      // fallback to pool query
      const rows = (await this.database.getPool().query('select enabled, action, after_hours, updated_at from kb_auto_action_global limit 1')).rows;
      if (!rows || rows.length === 0) return null;
      const r = rows[0];
      return { enabled: r.enabled, action: r.action as any, afterHours: r.after_hours ?? null, updatedAt: r.updated_at?.toISOString?.() ?? String(r.updated_at) };
    }
    const r = res[0];
    return { enabled: r.enabled, action: r.action as any, afterHours: r.after_hours ?? null, updatedAt: r.updated_at?.toISOString?.() ?? String(r.updated_at) };
  }

  async setAutoActionGlobal(input: { enabled: boolean; action: 'none' | 'resolved' | 'archived'; afterHours?: number | null }): Promise<AutoActionGlobal> {
    const pool = this.database.getPool();
    const res = await pool.query(
      `update kb_auto_action_global set enabled = $1, action = $2, after_hours = $3, updated_at = now() returning enabled, action, after_hours, updated_at`,
      [input.enabled, input.action, input.afterHours ?? null]
    );
    const r = res.rows[0];
    return { enabled: r.enabled, action: r.action as any, afterHours: r.after_hours ?? null, updatedAt: r.updated_at?.toISOString?.() ?? String(r.updated_at) };
  }
}
