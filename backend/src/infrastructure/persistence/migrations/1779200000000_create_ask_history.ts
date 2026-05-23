import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder) {
  pgm.sql(`
    create table if not exists kb_ask_history (
      id uuid primary key,
      user_id uuid not null references kb_users(id) on delete cascade,
      project_slug text not null default '',
      question text not null,
      answer text not null,
      confidence text not null default 'low',
      sources jsonb not null default '[]'::jsonb,
      related_notes jsonb not null default '[]'::jsonb,
      created_at timestamptz not null default now()
    );

    create index if not exists kb_ask_history_user_created_idx
      on kb_ask_history (user_id, created_at desc);

    create index if not exists kb_ask_history_user_project_created_idx
      on kb_ask_history (user_id, project_slug, created_at desc);
  `);
}

export async function down(pgm: MigrationBuilder) {
  pgm.sql('drop table if exists kb_ask_history;');
}
