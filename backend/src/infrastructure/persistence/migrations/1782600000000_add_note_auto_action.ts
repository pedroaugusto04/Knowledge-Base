import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('kb_notes', {
    auto_action: { type: 'text', notNull: true, default: 'none' },
  });
  pgm.addColumn('kb_notes', {
    auto_after_hours: { type: 'integer' },
  });
  pgm.addColumn('kb_notes', {
    auto_scheduled_at: { type: 'timestamp with time zone' },
  });
  pgm.createIndex('kb_notes', ['user_id', 'auto_action'], { name: 'idx_kb_notes_auto_action' });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('kb_notes', [], { name: 'idx_kb_notes_auto_action' });
  pgm.dropColumn('kb_notes', 'auto_scheduled_at');
  pgm.dropColumn('kb_notes', 'auto_after_hours');
  pgm.dropColumn('kb_notes', 'auto_action');
}
