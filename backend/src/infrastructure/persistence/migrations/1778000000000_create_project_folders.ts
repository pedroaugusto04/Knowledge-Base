import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('kb_project_folders', {
    id: { type: 'uuid', primaryKey: true },
    user_id: { type: 'uuid', notNull: true, references: 'kb_users(id)', onDelete: 'CASCADE' },
    workspace_slug: { type: 'text', notNull: true },
    project_slug: { type: 'text', notNull: true },
    parent_folder_id: { type: 'uuid', references: 'kb_project_folders(id)', onDelete: 'CASCADE' },
    display_name: { type: 'text', notNull: true },
    folder_slug: { type: 'text', notNull: true },
    full_slug_path: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('kb_project_folders', ['user_id', 'project_slug', 'parent_folder_id', 'folder_slug'], {
    name: 'kb_project_folders_sibling_slug_idx',
    unique: true,
  });
  pgm.createIndex('kb_project_folders', ['user_id', 'project_slug', 'full_slug_path'], {
    name: 'kb_project_folders_full_path_idx',
    unique: true,
  });
  pgm.createIndex('kb_project_folders', ['user_id', 'project_slug', 'parent_folder_id'], {
    name: 'kb_project_folders_parent_idx',
  });

  pgm.addColumn('kb_notes', {
    folder_id: { type: 'uuid', references: 'kb_project_folders(id)', onDelete: 'SET NULL' },
  });
  pgm.createIndex('kb_notes', ['user_id', 'project_slug', 'folder_id'], {
    name: 'kb_notes_user_project_folder_idx',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('kb_notes', ['user_id', 'project_slug', 'folder_id'], {
    name: 'kb_notes_user_project_folder_idx',
    ifExists: true,
  });
  pgm.dropColumn('kb_notes', 'folder_id', { ifExists: true });

  pgm.dropIndex('kb_project_folders', ['user_id', 'project_slug', 'parent_folder_id'], {
    name: 'kb_project_folders_parent_idx',
    ifExists: true,
  });
  pgm.dropIndex('kb_project_folders', ['user_id', 'project_slug', 'full_slug_path'], {
    name: 'kb_project_folders_full_path_idx',
    ifExists: true,
  });
  pgm.dropIndex('kb_project_folders', ['user_id', 'project_slug', 'parent_folder_id', 'folder_slug'], {
    name: 'kb_project_folders_sibling_slug_idx',
    ifExists: true,
  });
  pgm.dropTable('kb_project_folders', { ifExists: true });
}
