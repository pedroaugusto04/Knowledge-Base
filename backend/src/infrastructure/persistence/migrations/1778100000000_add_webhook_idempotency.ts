import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder) {
  pgm.sql(`
    create table if not exists kb_webhook_idempotency_keys (
      provider text not null,
      event_type text not null default '',
      idempotency_key text not null,
      resolved_user_id uuid references kb_users(id) on delete set null,
      external_identity jsonb not null default '{}'::jsonb,
      raw_headers jsonb not null default '{}'::jsonb,
      raw_payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (provider, event_type, idempotency_key)
    );
    create index if not exists kb_webhook_idempotency_keys_created_at_idx
      on kb_webhook_idempotency_keys (created_at desc);
  `);
}

export async function down(pgm: MigrationBuilder) {
  pgm.sql(`
    drop table if exists kb_webhook_idempotency_keys;
  `);
}
