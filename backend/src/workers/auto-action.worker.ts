import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { schedule } from 'node-cron';
import { PostgresDatabase } from '../infrastructure/persistence/database.js';
import { AppLogger } from '../observability/logger.js';
import { eq, and, lt, sql } from 'drizzle-orm';
import { AUTO_ACTION_NONE } from '../domain/auto-action.constants.js';

const AUTO_ACTION_CRON = process.env.AUTO_ACTION_CRON ?? '0 */1 * * *'; // every hour by default
const AUTO_ACTION_TIMEZONE = process.env.AUTO_ACTION_TIMEZONE ?? 'UTC';

@Injectable()
export class AutoActionWorker implements OnModuleInit, OnModuleDestroy {
  private cronTask: any;

  constructor(
    private readonly database: PostgresDatabase,
    private readonly logger: AppLogger,
  ) {}

  onModuleInit() {
    this.startAutoActionWorker();
  }

  onModuleDestroy() {
    if (this.cronTask) this.cronTask.stop();
  }

  startAutoActionWorker() {
    this.logger.info('[worker] auto-action batch worker starting');
    this.logger.info(`[worker] AUTO_ACTION_CRON=${AUTO_ACTION_CRON}`);

    this.cronTask = schedule(
      AUTO_ACTION_CRON,
      async () => {
        await this.runAutoActionJob();
      },
      { timezone: AUTO_ACTION_TIMEZONE }
    );
  }

  private async runAutoActionJob() {
    this.logger.info('[worker] running auto-action batch job');
    const pool = this.database.getPool();

    try {
      // read all user-scoped auto-action settings that are enabled
      const rows = (await pool.query("select user_id, enabled, action, after_hours from kb_auto_action_global where enabled = true")).rows;
      if (!rows || rows.length === 0) {
        this.logger.info('[worker] no user auto-action configured/enabled');
        return;
      }

      for (const g of rows) {
        if (!g || !g.after_hours || g.action === AUTO_ACTION_NONE) {
          this.logger.info(`[worker] skipping user=${g?.user_id} - auto-action not configured or none`);
          continue;
        }

        const afterHours = Number(g.after_hours);
        const action = String(g.action);

        // Update notes for this specific user: only active notes older than afterHours
        const res = await pool.query(
          `update kb_notes set status = $1::note_status_enum, updated_at = now()
             where user_id = $3::uuid and status = 'active' and created_at <= now() - ($2::int * interval '1 hour')
             returning id`,
          [action, afterHours, g.user_id]
        );

        const applied = Number(res.rowCount ?? 0);
        if (applied > 0) {
          this.logger.info(`[worker] applied auto-action='${action}' to ${applied} notes for user=${g.user_id}`);
        } else {
          this.logger.info(`[worker] no notes eligible for auto-action for user=${g.user_id}`);
        }
      }
    } catch (err) {
      this.logger.error('[worker] auto-action job failed', { error: err instanceof Error ? err.message : String(err) });
    }
  }
}
