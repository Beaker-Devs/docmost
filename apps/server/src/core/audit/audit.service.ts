import { Injectable, Logger } from '@nestjs/common';
import { AuditRepo } from '@docmost/db/repos/audit/audit.repo';
import { InsertableAuditLog } from '@docmost/db/types/entity.types';
import { ListAuditLogsDto } from './dto/list-audit.dto';
import { decodeAuditCursor, encodeAuditCursor } from './audit-cursor';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepo: AuditRepo) {}

  /**
   * Record an audit entry. Never throws — auditing must not break the request
   * that triggered it.
   */
  async record(entry: InsertableAuditLog): Promise<void> {
    try {
      await this.auditRepo.insertAuditLog(entry);
    } catch (err) {
      this.logger.error(
        `Failed to write audit log: ${(err as Error)?.message}`,
      );
    }
  }

  async list(workspaceId: string, dto: ListAuditLogsDto) {
    const limit = dto.limit ?? 30;
    const { items, nextCursorId } = await this.auditRepo.getWorkspaceAuditLogs(
      workspaceId,
      {
        userId: dto.userId,
        action: dto.action,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      { limit, cursorId: decodeAuditCursor(dto.cursor) },
    );

    return {
      items,
      nextCursor: nextCursorId ? encodeAuditCursor(nextCursorId) : null,
    };
  }

  /** Audit trail scoped to a single page (its own activity feed). */
  async listForPage(
    workspaceId: string,
    pageId: string,
    opts: { cursor?: string; limit?: number },
  ) {
    const limit = opts.limit ?? 30;
    const { items, nextCursorId } = await this.auditRepo.getWorkspaceAuditLogs(
      workspaceId,
      { resourceType: 'page', resourceId: pageId },
      { limit, cursorId: decodeAuditCursor(opts.cursor) },
    );

    return {
      items,
      nextCursor: nextCursorId ? encodeAuditCursor(nextCursorId) : null,
    };
  }

  async getActions(workspaceId: string): Promise<string[]> {
    return this.auditRepo.getDistinctActions(workspaceId);
  }
}
