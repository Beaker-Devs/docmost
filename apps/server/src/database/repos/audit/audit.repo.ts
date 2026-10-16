import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB, KyselyTransaction } from '../../types/kysely.types';
import { dbOrTx } from '../../utils';
import {
  AuditLog,
  InsertableAuditLog,
} from '@docmost/db/types/entity.types';
import { ExpressionBuilder } from 'kysely';
import { DB } from '@docmost/db/types/db';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface KeysetOptions {
  limit: number;
  cursorId?: string | null;
}

@Injectable()
export class AuditRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  private baseFields: Array<keyof AuditLog> = [
    'id',
    'action',
    'resourceType',
    'resourceId',
    'detail',
    'ipAddress',
    'userAgent',
    'userId',
    'workspaceId',
    'createdAt',
  ];

  async insertAuditLog(
    insertable: InsertableAuditLog,
    trx?: KyselyTransaction,
  ): Promise<void> {
    await dbOrTx(this.db, trx)
      .insertInto('auditLogs')
      .values(insertable)
      .execute();
  }

  /**
   * Keyset pagination on id (uuid v7 → chronological). Returns up to `limit`
   * rows plus a nextCursor (the last row's id) when more remain.
   */
  async getWorkspaceAuditLogs(
    workspaceId: string,
    filters: AuditLogFilters,
    opts: KeysetOptions,
  ): Promise<{ items: any[]; nextCursorId: string | null }> {
    let query = this.db
      .selectFrom('auditLogs')
      .select(this.baseFields)
      .select((eb) => this.withActor(eb))
      .where('workspaceId', '=', workspaceId)
      .orderBy('id', 'desc')
      .limit(opts.limit + 1); // fetch one extra to detect a next page

    if (opts.cursorId) {
      query = query.where('id', '<', opts.cursorId);
    }
    if (filters.userId) {
      query = query.where('userId', '=', filters.userId);
    }
    if (filters.action) {
      query = query.where('action', '=', filters.action);
    }
    if (filters.startDate) {
      query = query.where('createdAt', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('createdAt', '<=', filters.endDate);
    }

    const rows = await query.execute();
    const hasMore = rows.length > opts.limit;
    const items = hasMore ? rows.slice(0, opts.limit) : rows;
    const nextCursorId = hasMore ? items[items.length - 1].id : null;
    return { items, nextCursorId };
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const result = await this.db
      .deleteFrom('auditLogs')
      .where('createdAt', '<', cutoff)
      .executeTakeFirst();
    return Number(result?.numDeletedRows ?? 0);
  }

  /** Distinct action keys present for a workspace, for the filter dropdown. */
  async getDistinctActions(workspaceId: string): Promise<string[]> {
    const rows = await this.db
      .selectFrom('auditLogs')
      .select('action')
      .distinct()
      .where('workspaceId', '=', workspaceId)
      .orderBy('action', 'asc')
      .execute();
    return rows.map((r) => r.action);
  }

  withActor(eb: ExpressionBuilder<DB, 'auditLogs'>) {
    return jsonObjectFrom(
      eb
        .selectFrom('users')
        .select(['users.id', 'users.name', 'users.email', 'users.avatarUrl'])
        .whereRef('users.id', '=', 'auditLogs.userId'),
    ).as('actor');
  }
}
