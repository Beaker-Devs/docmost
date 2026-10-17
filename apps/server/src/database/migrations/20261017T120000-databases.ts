import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // a first-class database (Notion-style): typed columns + rows + saved views
  await db.schema
    .createTable('databases')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('title', 'varchar', (col) => col.notNull())
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

  // columns/properties of a database
  await db.schema
    .createTable('database_fields')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    // text | number | select | multi_select | date | checkbox | user | url
    .addColumn('type', 'varchar', (col) => col.notNull())
    .addColumn('position', 'varchar', (col) => col)
    // type-specific config, e.g. { options: [{id,name,color}] } for select
    .addColumn('config', 'jsonb', (col) => col.defaultTo(sql`'{}'::jsonb`))
    .addColumn('database_id', 'uuid', (col) =>
      col.references('databases.id').onDelete('cascade').notNull(),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // rows; cell values keyed by field id in a jsonb map
  await db.schema
    .createTable('database_rows')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('position', 'varchar', (col) => col)
    .addColumn('cells', 'jsonb', (col) =>
      col.notNull().defaultTo(sql`'{}'::jsonb`),
    )
    .addColumn('creator_id', 'uuid', (col) => col.references('users.id'))
    .addColumn('database_id', 'uuid', (col) =>
      col.references('databases.id').onDelete('cascade').notNull(),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // saved views: a named table/board view with filters, sorts, grouping
  await db.schema
    .createTable('database_views')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    // table | board
    .addColumn('type', 'varchar', (col) => col.notNull().defaultTo('table'))
    .addColumn('filters', 'jsonb', (col) =>
      col.notNull().defaultTo(sql`'[]'::jsonb`),
    )
    .addColumn('sorts', 'jsonb', (col) =>
      col.notNull().defaultTo(sql`'[]'::jsonb`),
    )
    // field id to group by (board view / table grouping)
    .addColumn('group_by', 'uuid', (col) => col)
    .addColumn('config', 'jsonb', (col) => col.defaultTo(sql`'{}'::jsonb`))
    .addColumn('position', 'varchar', (col) => col)
    .addColumn('database_id', 'uuid', (col) =>
      col.references('databases.id').onDelete('cascade').notNull(),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('databases_space_id_idx')
    .on('databases')
    .column('space_id')
    .execute();

  await db.schema
    .createIndex('database_fields_database_id_idx')
    .on('database_fields')
    .column('database_id')
    .execute();

  await db.schema
    .createIndex('database_rows_database_id_idx')
    .on('database_rows')
    .column('database_id')
    .execute();

  await db.schema
    .createIndex('database_views_database_id_idx')
    .on('database_views')
    .column('database_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('database_views').execute();
  await db.schema.dropTable('database_rows').execute();
  await db.schema.dropTable('database_fields').execute();
  await db.schema.dropTable('databases').execute();
}
