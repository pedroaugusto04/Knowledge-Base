import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('kb_notes', {
    is_pinned: { type: 'boolean', notNull: true, default: false },
  });
  pgm.createIndex('kb_notes', ['user_id', 'is_pinned'], {
    name: 'idx_kb_notes_user_pinned',
    where: 'is_pinned = true',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('kb_notes', [], { name: 'idx_kb_notes_user_pinned' });
  pgm.dropColumn('kb_notes', 'is_pinned');
}
