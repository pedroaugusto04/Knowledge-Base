import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // 1. Create junction table
  pgm.createTable('kb_project_repositories', {
    project_id: { type: 'uuid', notNull: true, references: 'kb_projects(id)', onDelete: 'CASCADE' },
    external_repo_id: { type: 'bigint', notNull: true, default: 0 },
    repo_full_name: { type: 'text', notNull: true },
  });
  pgm.addConstraint('kb_project_repositories', 'kb_project_repositories_pk', { primaryKey: ['project_id', 'repo_full_name'] });
  pgm.createIndex('kb_project_repositories', 'external_repo_id');

  // 2. Migrate existing data
  pgm.sql(`
    INSERT INTO kb_project_repositories (project_id, repo_full_name, external_repo_id)
    SELECT id, repo_full_name, 0 FROM kb_projects
    WHERE repo_full_name IS NOT NULL AND repo_full_name <> ''
  `);

  // 3. Drop denormalized column
  pgm.dropColumn('kb_projects', 'repo_full_name');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // 1. Add column back
  pgm.addColumn('kb_projects', {
    repo_full_name: { type: 'text', notNull: true, default: '' },
  });

  // 2. Restore data (pick the first one if multiple exist)
  pgm.sql(`
    UPDATE kb_projects p SET
      repo_full_name = COALESCE((SELECT repo_full_name FROM kb_project_repositories WHERE project_id = p.id LIMIT 1), '')
  `);

  // 3. Drop table
  pgm.dropTable('kb_project_repositories');
}
