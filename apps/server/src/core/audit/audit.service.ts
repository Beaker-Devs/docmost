import { Injectable, Logger } from '@nestjs/common';
import { AuditRepo } from '@docmost/db/repos/audit/audit.repo';
import { InsertableAuditLog } from '@docmost/db/types/entity.types';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import { ListAuditLogsDto } from './dto/list-audit.dto';

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

  async list(
    workspaceId: string,
    dto: ListAuditLogsDto,
    pagination: PaginationOptions,
  ) {
    return this.auditRepo.getWorkspaceAuditLogs(
      workspaceId,
      {
        userId: dto.userId,
        action: dto.action,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      pagination,
    );
  }

  async getActions(workspaceId: string): Promise<string[]> {
    return this.auditRepo.getDistinctActions(workspaceId);
  }
}
