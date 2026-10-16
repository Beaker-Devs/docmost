import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('audit_logs')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('action', 'varchar', (col) => col.notNull())
    .addColumn('resource_type', 'varchar', (col) => col)
    .addColumn('resource_id', 'varchar', (col) => col)
    .addColumn('detail', 'jsonb', (col) => col)
    .addColumn('ip_address', 'varchar', (col) => col)
    .addColumn('user_agent', 'text', (col) => col)
    // actor; null for system/anonymous actions. Keep the row if the user is
    // deleted so the trail is preserved.
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('workspace_id', 'uuid', (col) =>
      col.references('workspaces.id').onDelete('cascade').notNull(),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // primary access pattern: a workspace's log, newest first
  await db.schema
    .createIndex('audit_logs_workspace_id_created_at_idx')
    .on('audit_logs')
    .columns(['workspace_id', 'created_at desc'])
    .execute();

  // filter by actor
  await db.schema
    .createIndex('audit_logs_user_id_idx')
    .on('audit_logs')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('audit_logs').execute();
}
