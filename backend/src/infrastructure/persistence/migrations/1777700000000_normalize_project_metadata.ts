import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // 1. Create child tables
  pgm.createTable('kb_project_aliases', {
    project_id: { type: 'uuid', notNull: true, references: 'kb_projects(id)', onDelete: 'CASCADE' },
    alias: { type: 'text', notNull: true },
  });
  pgm.addConstraint('kb_project_aliases', 'kb_project_aliases_pk', { primaryKey: ['project_id', 'alias'] });

  pgm.createTable('kb_project_default_tags', {
    project_id: { type: 'uuid', notNull: true, references: 'kb_projects(id)', onDelete: 'CASCADE' },
    tag: { type: 'text', notNull: true },
  });
  pgm.addConstraint('kb_project_default_tags', 'kb_project_default_tags_pk', { primaryKey: ['project_id', 'tag'] });

  // 2. Migrate existing data
  pgm.sql(`
    INSERT INTO kb_project_aliases (project_id, alias)
    SELECT id, jsonb_array_elements_text(aliases) FROM kb_projects
    WHERE jsonb_array_length(aliases) > 0
  `);

  pgm.sql(`
    INSERT INTO kb_project_default_tags (project_id, tag)
    SELECT id, jsonb_array_elements_text(default_tags) FROM kb_projects
    WHERE jsonb_array_length(default_tags) > 0
  `);

  // 3. Drop denormalized columns
  pgm.dropColumns('kb_projects', ['aliases', 'default_tags']);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // 1. Add columns back
  pgm.addColumns('kb_projects', {
    aliases: { type: 'jsonb', notNull: true, default: '[]' },
    default_tags: { type: 'jsonb', notNull: true, default: '[]' },
  });

  // 2. Restore data
  pgm.sql(`
    UPDATE kb_projects p SET
      aliases = COALESCE((SELECT jsonb_agg(alias) FROM kb_project_aliases WHERE project_id = p.id), '[]'::jsonb),
      default_tags = COALESCE((SELECT jsonb_agg(tag) FROM kb_project_default_tags WHERE project_id = p.id), '[]'::jsonb)
  `);

  // 3. Drop tables
  pgm.dropTable('kb_project_default_tags');
  pgm.dropTable('kb_project_aliases');
}
