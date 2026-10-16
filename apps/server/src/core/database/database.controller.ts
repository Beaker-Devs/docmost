import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DatabaseService } from './services/database.service';
import { DatabaseRepo } from '@docmost/db/repos/database/database.repo';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, Workspace } from '@docmost/db/types/entity.types';
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from '../casl/interfaces/space-ability.type';
import SpaceAbilityFactory from '../casl/abilities/space-ability.factory';
import {
  CreateDatabaseDto,
  CreateFieldDto,
  CreateRowDto,
  CreateViewDto,
  DatabaseIdDto,
  FieldIdDto,
  ListRowsDto,
  RowIdDto,
  SpaceIdDto,
  UpdateDatabaseDto,
  UpdateFieldDto,
  UpdateRowDto,
  UpdateViewDto,
  ViewIdDto,
} from './dto/database.dto';

@UseGuards(JwtAuthGuard)
@Controller('databases')
export class DatabaseController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly databaseRepo: DatabaseRepo,
    private readonly spaceAbility: SpaceAbilityFactory,
  ) {}

  private async assertSpaceAbility(
    user: User,
    spaceId: string,
    action: SpaceCaslAction,
  ) {
    const ability = await this.spaceAbility.createForUser(user, spaceId);
    if (ability.cannot(action, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }
  }

  private async assertDatabaseAbility(
    user: User,
    databaseId: string,
    action: SpaceCaslAction,
  ) {
    const spaceId = await this.databaseService.spaceIdForDatabase(databaseId);
    if (!spaceId) {
      throw new NotFoundException('Database not found');
    }
    await this.assertSpaceAbility(user, spaceId, action);
  }

  private async databaseIdForField(fieldId: string): Promise<string> {
    const field = await this.databaseRepo.findFieldById(fieldId);
    if (!field) throw new NotFoundException('Field not found');
    return field.databaseId;
  }

  private async databaseIdForRow(rowId: string): Promise<string> {
    const row = await this.databaseRepo.findRowById(rowId);
    if (!row) throw new NotFoundException('Row not found');
    return row.databaseId;
  }

  private async databaseIdForView(viewId: string): Promise<string> {
    const view = await this.databaseRepo.findViewById(viewId);
    if (!view) throw new NotFoundException('View not found');
    return view.databaseId;
  }

  // ---- database ----
  @HttpCode(HttpStatus.OK)
  @Post('create')
  async create(
    @Body() dto: CreateDatabaseDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    await this.assertSpaceAbility(user, dto.spaceId, SpaceCaslAction.Create);
    return this.databaseService.createDatabase(dto, workspace.id, user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('info')
  async info(@Body() dto: DatabaseIdDto, @AuthUser() user: User) {
    await this.assertDatabaseAbility(
      user,
      dto.databaseId,
      SpaceCaslAction.Read,
    );
    return this.databaseService.getDatabase(dto.databaseId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('list')
  async list(@Body() dto: SpaceIdDto, @AuthUser() user: User) {
    await this.assertSpaceAbility(user, dto.spaceId, SpaceCaslAction.Read);
    return this.databaseService.getBySpace(dto.spaceId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('update')
  async update(@Body() dto: UpdateDatabaseDto, @AuthUser() user: User) {
    await this.assertDatabaseAbility(
      user,
      dto.databaseId,
      SpaceCaslAction.Edit,
    );
    return this.databaseService.updateDatabase(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('delete')
  async remove(@Body() dto: DatabaseIdDto, @AuthUser() user: User) {
    await this.assertDatabaseAbility(
      user,
      dto.databaseId,
      SpaceCaslAction.Manage,
    );
    await this.databaseService.deleteDatabase(dto.databaseId);
    return { success: true };
  }

  // ---- fields ----
  @HttpCode(HttpStatus.OK)
  @Post('fields/create')
  async createField(@Body() dto: CreateFieldDto, @AuthUser() user: User) {
    await this.assertDatabaseAbility(
      user,
      dto.databaseId,
      SpaceCaslAction.Edit,
    );
    return this.databaseService.createField(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('fields/update')
  async updateField(@Body() dto: UpdateFieldDto, @AuthUser() user: User) {
    const databaseId = await this.databaseIdForField(dto.fieldId);
    await this.assertDatabaseAbility(user, databaseId, SpaceCaslAction.Edit);
    return this.databaseService.updateField(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('fields/delete')
  async deleteField(@Body() dto: FieldIdDto, @AuthUser() user: User) {
    const databaseId = await this.databaseIdForField(dto.fieldId);
    await this.assertDatabaseAbility(user, databaseId, SpaceCaslAction.Edit);
    await this.databaseService.deleteField(dto.fieldId);
    return { success: true };
  }

  // ---- rows ----
  @HttpCode(HttpStatus.OK)
  @Post('rows/list')
  async listRows(@Body() dto: ListRowsDto, @AuthUser() user: User) {
    await this.assertDatabaseAbility(
      user,
      dto.databaseId,
      SpaceCaslAction.Read,
    );
    return this.databaseService.listRows(dto.databaseId, dto.limit);
  }

  @HttpCode(HttpStatus.OK)
  @Post('rows/create')
  async createRow(@Body() dto: CreateRowDto, @AuthUser() user: User) {
    await this.assertDatabaseAbility(
      user,
      dto.databaseId,
      SpaceCaslAction.Edit,
    );
    return this.databaseService.createRow(dto, user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('rows/update')
  async updateRow(@Body() dto: UpdateRowDto, @AuthUser() user: User) {
    const databaseId = await this.databaseIdForRow(dto.rowId);
    await this.assertDatabaseAbility(user, databaseId, SpaceCaslAction.Edit);
    return this.databaseService.updateRow(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('rows/delete')
  async deleteRow(@Body() dto: RowIdDto, @AuthUser() user: User) {
    const databaseId = await this.databaseIdForRow(dto.rowId);
    await this.assertDatabaseAbility(user, databaseId, SpaceCaslAction.Edit);
    await this.databaseService.deleteRow(dto.rowId);
    return { success: true };
  }

  // ---- views ----
  @HttpCode(HttpStatus.OK)
  @Post('views/create')
  async createView(@Body() dto: CreateViewDto, @AuthUser() user: User) {
    await this.assertDatabaseAbility(
      user,
      dto.databaseId,
      SpaceCaslAction.Edit,
    );
    return this.databaseService.createView(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('views/update')
  async updateView(@Body() dto: UpdateViewDto, @AuthUser() user: User) {
    const databaseId = await this.databaseIdForView(dto.viewId);
    await this.assertDatabaseAbility(user, databaseId, SpaceCaslAction.Edit);
    return this.databaseService.updateView(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('views/delete')
  async deleteView(@Body() dto: ViewIdDto, @AuthUser() user: User) {
    const databaseId = await this.databaseIdForView(dto.viewId);
    await this.assertDatabaseAbility(user, databaseId, SpaceCaslAction.Edit);
    await this.databaseService.deleteView(dto.viewId);
    return { success: true };
  }
}
