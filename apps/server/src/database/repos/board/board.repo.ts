import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB, KyselyTransaction } from '../../types/kysely.types';
import { dbOrTx } from '../../utils';
import {
  Board,
  BoardColumn,
  Card,
  InsertableBoard,
  InsertableBoardColumn,
  InsertableCard,
  UpdatableBoard,
  UpdatableBoardColumn,
  UpdatableCard,
} from '@docmost/db/types/entity.types';
import { ExpressionBuilder } from 'kysely';
import { DB } from '@docmost/db/types/db';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

@Injectable()
export class BoardRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  private boardFields: Array<keyof Board> = [
    'id',
    'title',
    'description',
    'icon',
    'creatorId',
    'spaceId',
    'workspaceId',
    'createdAt',
    'updatedAt',
    'deletedAt',
  ];

  private columnFields: Array<keyof BoardColumn> = [
    'id',
    'name',
    'color',
    'position',
    'boardId',
    'createdAt',
    'updatedAt',
  ];

  private cardFields: Array<keyof Card> = [
    'id',
    'title',
    'description',
    'position',
    'labels',
    'dueDate',
    'columnId',
    'boardId',
    'pageId',
    'assigneeId',
    'creatorId',
    'createdAt',
    'updatedAt',
  ];

  // ---------- boards ----------

  async findById(boardId: string, trx?: KyselyTransaction): Promise<Board> {
    const db = dbOrTx(this.db, trx);
    return db
      .selectFrom('boards')
      .select(this.boardFields)
      .where('id', '=', boardId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async getBoardsInSpace(spaceId: string): Promise<Board[]> {
    return this.db
      .selectFrom('boards')
      .select(this.boardFields)
      .select((eb) => this.withCreator(eb))
      .where('spaceId', '=', spaceId)
      .where('deletedAt', 'is', null)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async insertBoard(
    insertableBoard: InsertableBoard,
    trx?: KyselyTransaction,
  ): Promise<Board> {
    return dbOrTx(this.db, trx)
      .insertInto('boards')
      .values(insertableBoard)
      .returning(this.boardFields)
      .executeTakeFirst();
  }

  async updateBoard(
    updatableBoard: UpdatableBoard,
    boardId: string,
    trx?: KyselyTransaction,
  ): Promise<Board> {
    return dbOrTx(this.db, trx)
      .updateTable('boards')
      .set({ ...updatableBoard, updatedAt: new Date() })
      .where('id', '=', boardId)
      .returning(this.boardFields)
      .executeTakeFirst();
  }

  async softDeleteBoard(boardId: string): Promise<void> {
    await this.db
      .updateTable('boards')
      .set({ deletedAt: new Date() })
      .where('id', '=', boardId)
      .execute();
  }

  // ---------- columns ----------

  async getColumns(boardId: string): Promise<BoardColumn[]> {
    return this.db
      .selectFrom('boardColumns')
      .select(this.columnFields)
      .where('boardId', '=', boardId)
      .orderBy('position', 'asc')
      .execute();
  }

  async findColumnById(columnId: string): Promise<BoardColumn> {
    return this.db
      .selectFrom('boardColumns')
      .select(this.columnFields)
      .where('id', '=', columnId)
      .executeTakeFirst();
  }

  async getLastColumn(boardId: string): Promise<BoardColumn | undefined> {
    return this.db
      .selectFrom('boardColumns')
      .select(this.columnFields)
      .where('boardId', '=', boardId)
      .orderBy('position', 'desc')
      .limit(1)
      .executeTakeFirst();
  }

  async insertColumn(
    insertableColumn: InsertableBoardColumn,
    trx?: KyselyTransaction,
  ): Promise<BoardColumn> {
    return dbOrTx(this.db, trx)
      .insertInto('boardColumns')
      .values(insertableColumn)
      .returning(this.columnFields)
      .executeTakeFirst();
  }

  async updateColumn(
    updatableColumn: UpdatableBoardColumn,
    columnId: string,
  ): Promise<BoardColumn> {
    return this.db
      .updateTable('boardColumns')
      .set({ ...updatableColumn, updatedAt: new Date() })
      .where('id', '=', columnId)
      .returning(this.columnFields)
      .executeTakeFirst();
  }

  async deleteColumn(columnId: string): Promise<void> {
    await this.db
      .deleteFrom('boardColumns')
      .where('id', '=', columnId)
      .execute();
  }

  // ---------- cards ----------

  async getCards(boardId: string): Promise<Card[]> {
    return this.db
      .selectFrom('cards')
      .select(this.cardFields)
      .select((eb) => this.withAssignee(eb))
      .where('boardId', '=', boardId)
      .orderBy('position', 'asc')
      .execute();
  }

  async findCardById(cardId: string): Promise<Card> {
    return this.db
      .selectFrom('cards')
      .select(this.cardFields)
      .where('id', '=', cardId)
      .executeTakeFirst();
  }

  async getLastCardInColumn(columnId: string): Promise<Card | undefined> {
    return this.db
      .selectFrom('cards')
      .select(this.cardFields)
      .where('columnId', '=', columnId)
      .orderBy('position', 'desc')
      .limit(1)
      .executeTakeFirst();
  }

  async insertCard(
    insertableCard: InsertableCard,
    trx?: KyselyTransaction,
  ): Promise<Card> {
    return dbOrTx(this.db, trx)
      .insertInto('cards')
      .values(insertableCard)
      .returning(this.cardFields)
      .executeTakeFirst();
  }

  async updateCard(
    updatableCard: UpdatableCard,
    cardId: string,
  ): Promise<Card> {
    return this.db
      .updateTable('cards')
      .set({ ...updatableCard, updatedAt: new Date() })
      .where('id', '=', cardId)
      .returning(this.cardFields)
      .executeTakeFirst();
  }

  async deleteCard(cardId: string): Promise<void> {
    await this.db.deleteFrom('cards').where('id', '=', cardId).execute();
  }

  // ---------- relation helpers ----------

  withCreator(eb: ExpressionBuilder<DB, 'boards'>) {
    return jsonObjectFrom(
      eb
        .selectFrom('users')
        .select(['users.id', 'users.name', 'users.avatarUrl'])
        .whereRef('users.id', '=', 'boards.creatorId'),
    ).as('creator');
  }

  withAssignee(eb: ExpressionBuilder<DB, 'cards'>) {
    return jsonObjectFrom(
      eb
        .selectFrom('users')
        .select(['users.id', 'users.name', 'users.avatarUrl'])
        .whereRef('users.id', '=', 'cards.assigneeId'),
    ).as('assignee');
  }
}
