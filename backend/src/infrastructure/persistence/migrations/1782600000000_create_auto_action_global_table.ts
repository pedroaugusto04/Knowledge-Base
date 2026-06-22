import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('kb_auto_action_global', {
    id: { type: 'serial', primaryKey: true },
    enabled: { type: 'boolean', notNull: true, default: false },
    action: { type: 'text', notNull: true, default: 'none' },
    after_hours: { type: 'integer' },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });

  // seed default row
  pgm.sql(`INSERT INTO kb_auto_action_global (enabled, action, after_hours) VALUES (false, 'none', NULL)`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('kb_auto_action_global');
}
