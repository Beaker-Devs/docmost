import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // supports keyset pagination: WHERE workspace_id = ? [AND id < ?] ORDER BY id DESC
  await db.schema
    .createIndex('audit_logs_workspace_id_id_idx')
    .on('audit_logs')
    .columns(['workspace_id', 'id desc'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('audit_logs_workspace_id_id_idx').execute();
}
