import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder) {
  pgm.sql(`
    alter table kb_users
      add column if not exists avatar text default '';
  `);
}

export async function down(pgm: MigrationBuilder) {
  pgm.sql(`
    alter table kb_users
      drop column if exists avatar;
  `);
}
