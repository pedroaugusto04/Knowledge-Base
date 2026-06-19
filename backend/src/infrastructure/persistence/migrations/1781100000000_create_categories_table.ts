import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // 1. Create kb_categories table
  pgm.createTable('kb_categories', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'kb_users(id)', onDelete: 'CASCADE' },
    workspace_id: { type: 'uuid', notNull: true, references: 'kb_workspaces(id)', onDelete: 'CASCADE' },
    name: { type: 'text', notNull: true },
    color: { type: 'text', notNull: true, default: '#9e9e9e' },
    icon: { type: 'text', notNull: true, default: '' },
    is_system: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addIndex('kb_categories', ['workspace_id', 'name'], { unique: true });

  // 2. Create kb_note_categories table
  pgm.createTable('kb_note_categories', {
    note_id: { type: 'uuid', notNull: true, references: 'kb_notes(id)', onDelete: 'CASCADE' },
    category_id: { type: 'uuid', notNull: true, references: 'kb_categories(id)', onDelete: 'CASCADE' },
  });
  pgm.addConstraint('kb_note_categories', 'kb_note_categories_pk', { primaryKey: ['note_id', 'category_id'] });

  // 3. Seed default system categories for all workspaces
  pgm.sql(`
    INSERT INTO kb_categories (id, user_id, workspace_id, name, color, icon, is_system, created_at, updated_at)
    SELECT 
      gen_random_uuid(),
      w.user_id,
      w.id,
      cat.name,
      cat.color,
      cat.icon,
      true,
      now(),
      now()
    FROM kb_workspaces w
    CROSS JOIN (
      VALUES 
        ('event', '#3f51b5', 'event'),
        ('decision', '#4caf50', 'gavel'),
        ('knowledge', '#2196f3', 'book'),
        ('incident', '#f44336', 'error'),
        ('followup', '#ff9800', 'assignment')
    ) AS cat(name, color, icon)
    ON CONFLICT (workspace_id, name) DO NOTHING;
  `);

  // 4. Map existing notes to categories
  pgm.sql(`
    INSERT INTO kb_note_categories (note_id, category_id)
    SELECT n.id, c.id
    FROM kb_notes n
    JOIN kb_categories c ON c.workspace_id = n.workspace_id AND c.name = n.type::text
    ON CONFLICT (note_id, category_id) DO NOTHING;
  `);

  // 5. Drop note type column and the enum type
  pgm.sql('ALTER TABLE kb_notes DROP COLUMN IF EXISTS type;');
  pgm.sql('DROP TYPE IF EXISTS note_type_enum;');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('kb_note_categories');
  pgm.dropTable('kb_categories');
}
