import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('boards')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('title', 'varchar', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col)
    .addColumn('icon', 'varchar', (col) => col)
    .addColumn('creator_id', 'uuid', (col) => col.references('users.id'))
    .addColumn('space_id', 'uuid', (col) =>
      col.references('spaces.id').onDelete('cascade').notNull(),
    )
    .addColumn('workspace_id', 'uuid', (col) =>
      col.references('workspaces.id').onDelete('cascade').notNull(),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz', (col) => col)
    .execute();

  await db.schema
    .createTable('board_columns')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('color', 'varchar', (col) => col)
    .addColumn('position', 'varchar', (col) => col)
    .addColumn('board_id', 'uuid', (col) =>
      col.references('boards.id').onDelete('cascade').notNull(),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createTable('cards')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('title', 'varchar', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col)
    .addColumn('position', 'varchar', (col) => col)
    .addColumn('labels', 'jsonb', (col) => col)
    .addColumn('due_date', 'timestamptz', (col) => col)
    .addColumn('column_id', 'uuid', (col) =>
      col.references('board_columns.id').onDelete('cascade').notNull(),
    )
    .addColumn('board_id', 'uuid', (col) =>
      col.references('boards.id').onDelete('cascade').notNull(),
    )
    // a card can optionally be backed by a full page (phase 3)
    .addColumn('page_id', 'uuid', (col) =>
      col.references('pages.id').onDelete('set null'),
    )
    .addColumn('assignee_id', 'uuid', (col) =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('creator_id', 'uuid', (col) => col.references('users.id'))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('boards_space_id_idx')
    .on('boards')
    .column('space_id')
    .execute();

  await db.schema
    .createIndex('board_columns_board_id_idx')
    .on('board_columns')
    .column('board_id')
    .execute();

  await db.schema
    .createIndex('cards_column_id_idx')
    .on('cards')
    .column('column_id')
    .execute();

  await db.schema
    .createIndex('cards_board_id_idx')
    .on('cards')
    .column('board_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('cards').execute();
  await db.schema.dropTable('board_columns').execute();
  await db.schema.dropTable('boards').execute();
}
