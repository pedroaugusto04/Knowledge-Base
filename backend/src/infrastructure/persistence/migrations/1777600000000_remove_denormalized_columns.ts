import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('schema_migrations', { ifExists: true });
  pgm.dropColumns('kb_workspaces', ['github_repos', 'project_slugs'], { ifExists: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns('kb_workspaces', {
    github_repos: { type: 'jsonb', notNull: true, default: '[]' },
    project_slugs: { type: 'jsonb', notNull: true, default: '[]' },
  });
}
