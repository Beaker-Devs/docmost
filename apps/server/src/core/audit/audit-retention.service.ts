import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditRepo } from '@docmost/db/repos/audit/audit.repo';
import { EnvironmentService } from '../../integrations/environment/environment.service';

@Injectable()
export class AuditRetentionService {
  private readonly logger = new Logger(AuditRetentionService.name);

  constructor(
    private readonly auditRepo: AuditRepo,
    private readonly environmentService: EnvironmentService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'audit-log-retention' })
  async prune(): Promise<void> {
    const days = this.environmentService.getAuditLogRetentionDays();
    if (days <= 0) {
      return; // retention disabled → keep everything
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    try {
      const deleted = await this.auditRepo.deleteOlderThan(cutoff);
      if (deleted > 0) {
        this.logger.log(
          `Pruned ${deleted} audit log(s) older than ${days} days`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Audit log retention prune failed: ${(err as Error)?.message}`,
      );
    }
  }
}
