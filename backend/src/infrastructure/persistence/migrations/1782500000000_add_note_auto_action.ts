import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('kb_notes', {
    auto_action: { type: 'text', notNull: true, default: 'none' },
    auto_after_hours: { type: 'integer' },
    auto_scheduled_at: { type: 'timestamp' },
  });
  pgm.createIndex('kb_notes', ['user_id', 'auto_action'], { name: 'idx_kb_notes_user_auto_action' });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('kb_notes', [], { name: 'idx_kb_notes_user_auto_action' });
  pgm.dropColumn('kb_notes', 'auto_action');
  pgm.dropColumn('kb_notes', 'auto_after_hours');
  pgm.dropColumn('kb_notes', 'auto_scheduled_at');
}
