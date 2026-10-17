import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB, KyselyTransaction } from '../../types/kysely.types';
import { dbOrTx } from '../../utils';
import {
  Database,
  DatabaseField,
  DatabaseRow,
  DatabaseView,
  InsertableDatabase,
  InsertableDatabaseField,
  InsertableDatabaseRow,
  InsertableDatabaseView,
  UpdatableDatabase,
  UpdatableDatabaseField,
  UpdatableDatabaseRow,
  UpdatableDatabaseView,
} from '@docmost/db/types/entity.types';

@Injectable()
export class DatabaseRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  // ---- databases ----
  async insertDatabase(
    insertable: InsertableDatabase,
    trx?: KyselyTransaction,
  ): Promise<Database> {
    return dbOrTx(this.db, trx)
      .insertInto('databases')
      .values(insertable)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findById(databaseId: string): Promise<Database | undefined> {
    return this.db
      .selectFrom('databases')
      .selectAll()
      .where('id', '=', databaseId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async findBySpace(spaceId: string): Promise<Database[]> {
    return this.db
      .selectFrom('databases')
      .selectAll()
      .where('spaceId', '=', spaceId)
      .where('deletedAt', 'is', null)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async updateDatabase(
    update: UpdatableDatabase,
    databaseId: string,
  ): Promise<void> {
    await this.db
      .updateTable('databases')
      .set({ ...update, updatedAt: new Date() })
      .where('id', '=', databaseId)
      .execute();
  }

  async softDelete(databaseId: string): Promise<void> {
    await this.db
      .updateTable('databases')
      .set({ deletedAt: new Date() })
      .where('id', '=', databaseId)
      .execute();
  }

  // ---- fields ----
  async insertField(
    insertable: InsertableDatabaseField,
    trx?: KyselyTransaction,
  ): Promise<DatabaseField> {
    return dbOrTx(this.db, trx)
      .insertInto('databaseFields')
      .values(insertable)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async listFields(databaseId: string): Promise<DatabaseField[]> {
    return this.db
      .selectFrom('databaseFields')
      .selectAll()
      .where('databaseId', '=', databaseId)
      .orderBy('position', 'asc')
      .execute();
  }

  async findFieldById(fieldId: string): Promise<DatabaseField | undefined> {
    return this.db
      .selectFrom('databaseFields')
      .selectAll()
      .where('id', '=', fieldId)
      .executeTakeFirst();
  }

  async updateField(
    update: UpdatableDatabaseField,
    fieldId: string,
  ): Promise<void> {
    await this.db
      .updateTable('databaseFields')
      .set({ ...update, updatedAt: new Date() })
      .where('id', '=', fieldId)
      .execute();
  }

  async deleteField(fieldId: string): Promise<void> {
    await this.db
      .deleteFrom('databaseFields')
      .where('id', '=', fieldId)
      .execute();
  }

  // ---- rows ----
  async insertRow(
    insertable: InsertableDatabaseRow,
    trx?: KyselyTransaction,
  ): Promise<DatabaseRow> {
    return dbOrTx(this.db, trx)
      .insertInto('databaseRows')
      .values(insertable)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async listRows(databaseId: string, limit = 1000): Promise<DatabaseRow[]> {
    return this.db
      .selectFrom('databaseRows')
      .selectAll()
      .where('databaseId', '=', databaseId)
      .orderBy('position', 'asc')
      .limit(limit)
      .execute();
  }

  async findRowById(rowId: string): Promise<DatabaseRow | undefined> {
    return this.db
      .selectFrom('databaseRows')
      .selectAll()
      .where('id', '=', rowId)
      .executeTakeFirst();
  }

  async updateRow(
    update: UpdatableDatabaseRow,
    rowId: string,
  ): Promise<void> {
    await this.db
      .updateTable('databaseRows')
      .set({ ...update, updatedAt: new Date() })
      .where('id', '=', rowId)
      .execute();
  }

  async deleteRow(rowId: string): Promise<void> {
    await this.db.deleteFrom('databaseRows').where('id', '=', rowId).execute();
  }

  async lastRowPosition(databaseId: string): Promise<string | null> {
    const row = await this.db
      .selectFrom('databaseRows')
      .select('position')
      .where('databaseId', '=', databaseId)
      .orderBy('position', 'desc')
      .limit(1)
      .executeTakeFirst();
    return row?.position ?? null;
  }

  // ---- views ----
  async insertView(
    insertable: InsertableDatabaseView,
    trx?: KyselyTransaction,
  ): Promise<DatabaseView> {
    return dbOrTx(this.db, trx)
      .insertInto('databaseViews')
      .values(insertable)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async listViews(databaseId: string): Promise<DatabaseView[]> {
    return this.db
      .selectFrom('databaseViews')
      .selectAll()
      .where('databaseId', '=', databaseId)
      .orderBy('position', 'asc')
      .execute();
  }

  async findViewById(viewId: string): Promise<DatabaseView | undefined> {
    return this.db
      .selectFrom('databaseViews')
      .selectAll()
      .where('id', '=', viewId)
      .executeTakeFirst();
  }

  async updateView(
    update: UpdatableDatabaseView,
    viewId: string,
  ): Promise<void> {
    await this.db
      .updateTable('databaseViews')
      .set({ ...update, updatedAt: new Date() })
      .where('id', '=', viewId)
      .execute();
  }

  async deleteView(viewId: string): Promise<void> {
    await this.db
      .deleteFrom('databaseViews')
      .where('id', '=', viewId)
      .execute();
  }

  async countViews(databaseId: string): Promise<number> {
    const row = await this.db
      .selectFrom('databaseViews')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('databaseId', '=', databaseId)
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }
}
