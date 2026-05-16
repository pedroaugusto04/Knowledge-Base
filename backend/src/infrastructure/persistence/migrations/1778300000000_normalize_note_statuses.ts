import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    update kb_notes
       set status = case
         when coalesce(metadata->>'reminderDate', '') <> ''
           and lower(status) in ('open', 'active', 'todo') then 'pending'
         when coalesce(metadata->>'reminderDate', '') = ''
           and lower(status) = 'open' then 'active'
         when lower(status) in ('done', 'closed') then 'resolved'
         else lower(status)
       end
     where lower(status) in ('open', 'active', 'todo', 'done', 'closed')
        or status <> lower(status);
  `);
}

export async function down(): Promise<void> {
  return;
}
