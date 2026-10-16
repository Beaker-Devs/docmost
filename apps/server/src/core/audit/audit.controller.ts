import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { ListAuditLogsDto } from './dto/list-audit.dto';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, Workspace } from '@docmost/db/types/entity.types';
import { PaginationOptions } from '@docmost/db/pagination/pagination-options';
import WorkspaceAbilityFactory from '../casl/abilities/workspace-ability.factory';
import {
  WorkspaceCaslAction,
  WorkspaceCaslSubject,
} from '../casl/interfaces/workspace-ability.type';

@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly workspaceAbility: WorkspaceAbilityFactory,
  ) {}

  /** Audit logs are an enterprise feature and readable by workspace admins only. */
  private authorize(user: User, workspace: Workspace) {
    if (!workspace?.licenseKey) {
      throw new ForbiddenException('An enterprise license is required');
    }
    const ability = this.workspaceAbility.createForUser(user, workspace);
    if (
      ability.cannot(WorkspaceCaslAction.Manage, WorkspaceCaslSubject.Settings)
    ) {
      throw new ForbiddenException();
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/list')
  async list(
    @Body() dto: ListAuditLogsDto,
    @Body() pagination: PaginationOptions,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    this.authorize(user, workspace);
    return this.auditService.list(workspace.id, dto, pagination);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/actions')
  async actions(
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    this.authorize(user, workspace);
    return this.auditService.getActions(workspace.id);
  }
}
