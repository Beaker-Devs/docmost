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
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import { executeWithPagination } from '@docmost/db/pagination/pagination';

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
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

  async getWorkspaceAuditLogs(
    workspaceId: string,
    filters: AuditLogFilters,
    pagination: PaginationOptions,
  ) {
    let query = this.db
      .selectFrom('auditLogs')
      .select(this.baseFields)
      .select((eb) => this.withActor(eb))
      .where('workspaceId', '=', workspaceId)
      .orderBy('createdAt', 'desc');

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

    return executeWithPagination(query, {
      page: pagination.page,
      perPage: pagination.limit,
    });
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
