import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder) {
  pgm.renameColumn('kb_workspaces', 'whatsapp_group_jid', 'whatsapp_chat_jid');
}

export async function down(pgm: MigrationBuilder) {
  pgm.renameColumn('kb_workspaces', 'whatsapp_chat_jid', 'whatsapp_group_jid');
}
