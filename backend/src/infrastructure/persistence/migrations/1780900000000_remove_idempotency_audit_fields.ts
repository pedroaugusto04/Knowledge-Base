import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder) {
  pgm.sql(`
    alter table kb_webhook_idempotency_keys
      drop column if exists external_identity,
      drop column if exists raw_headers,
      drop column if exists raw_payload;
  `);
}

export async function down(pgm: MigrationBuilder) {
  pgm.sql(`
    alter table kb_webhook_idempotency_keys
      add column if not exists external_identity jsonb not null default '{}'::jsonb,
      add column if not exists raw_headers jsonb not null default '{}'::jsonb,
      add column if not exists raw_payload jsonb not null default '{}'::jsonb;
  `);
}
