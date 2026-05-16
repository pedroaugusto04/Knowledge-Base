import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    update kb_notes
       set metadata = jsonb_set(
         metadata,
         '{reviewFindings}',
         (
           select jsonb_agg(finding - 'severity')
             from jsonb_array_elements(metadata->'reviewFindings') as finding
         ),
         true
       )
     where jsonb_typeof(metadata->'reviewFindings') = 'array'
       and exists (
         select 1
           from jsonb_array_elements(metadata->'reviewFindings') as finding
          where finding ? 'severity'
       );
  `);
}

export async function down(): Promise<void> {
  return;
}
