import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Drop per-note auto-action columns (migration to remove legacy columns)
  try {
    pgm.dropIndex('kb_notes', [], { name: 'idx_kb_notes_auto_action' });
  } catch (e) { /* ignore if not exists */ }

  try { pgm.dropColumn('kb_notes', 'auto_scheduled_at'); } catch (e) { /* ignore */ }
  try { pgm.dropColumn('kb_notes', 'auto_after_hours'); } catch (e) { /* ignore */ }
  try { pgm.dropColumn('kb_notes', 'auto_action'); } catch (e) { /* ignore */ }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Recreate the columns in case of rollback
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
