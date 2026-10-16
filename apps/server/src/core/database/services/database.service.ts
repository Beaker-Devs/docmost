import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';
import { DatabaseRepo } from '@docmost/db/repos/database/database.repo';
import {
  Database,
  DatabaseField,
  DatabaseRow,
  DatabaseView,
} from '@docmost/db/types/entity.types';
import {
  CreateDatabaseDto,
  CreateFieldDto,
  CreateRowDto,
  CreateViewDto,
  UpdateDatabaseDto,
  UpdateFieldDto,
  UpdateRowDto,
  UpdateViewDto,
} from '../dto/database.dto';

export interface DatabaseWithMeta extends Database {
  fields: DatabaseField[];
  views: DatabaseView[];
}

@Injectable()
export class DatabaseService {
  constructor(private readonly databaseRepo: DatabaseRepo) {}

  async createDatabase(
    dto: CreateDatabaseDto,
    workspaceId: string,
    userId: string,
  ): Promise<DatabaseWithMeta> {
    const database = await this.databaseRepo.insertDatabase({
      title: dto.title?.trim() || 'Untitled database',
      icon: dto.icon ?? null,
      spaceId: dto.spaceId,
      workspaceId,
      creatorId: userId,
    });

    // a sensible default schema: a primary "Name" text column + a "Status" select
    const namePos = generateJitteredKeyBetween(null, null);
    const statusPos = generateJitteredKeyBetween(namePos, null);
    await this.databaseRepo.insertField({
      databaseId: database.id,
      name: 'Name',
      type: 'text',
      position: namePos,
      config: {},
    });
    await this.databaseRepo.insertField({
      databaseId: database.id,
      name: 'Status',
      type: 'select',
      position: statusPos,
      config: {
        options: [
          { id: 'todo', name: 'To do', color: 'gray' },
          { id: 'doing', name: 'In progress', color: 'blue' },
          { id: 'done', name: 'Done', color: 'green' },
        ],
      },
    });

    await this.databaseRepo.insertView({
      databaseId: database.id,
      name: 'Table',
      type: 'table',
      position: generateJitteredKeyBetween(null, null),
    });

    return this.getDatabase(database.id);
  }

  async getDatabase(databaseId: string): Promise<DatabaseWithMeta> {
    const database = await this.databaseRepo.findById(databaseId);
    if (!database) {
      throw new NotFoundException('Database not found');
    }
    const [fields, views] = await Promise.all([
      this.databaseRepo.listFields(databaseId),
      this.databaseRepo.listViews(databaseId),
    ]);
    return { ...database, fields, views };
  }

  async getBySpace(spaceId: string): Promise<Database[]> {
    return this.databaseRepo.findBySpace(spaceId);
  }

  async updateDatabase(dto: UpdateDatabaseDto): Promise<DatabaseWithMeta> {
    await this.databaseRepo.updateDatabase(
      { title: dto.title, icon: dto.icon },
      dto.databaseId,
    );
    return this.getDatabase(dto.databaseId);
  }

  async deleteDatabase(databaseId: string): Promise<void> {
    await this.databaseRepo.softDelete(databaseId);
  }

  // ---- fields ----
  async createField(dto: CreateFieldDto): Promise<DatabaseField> {
    const fields = await this.databaseRepo.listFields(dto.databaseId);
    const last = fields[fields.length - 1];
    return this.databaseRepo.insertField({
      databaseId: dto.databaseId,
      name: dto.name?.trim() || 'Field',
      type: dto.type,
      config: dto.config ?? {},
      position: generateJitteredKeyBetween(last?.position ?? null, null),
    });
  }

  async updateField(dto: UpdateFieldDto): Promise<DatabaseField> {
    const field = await this.databaseRepo.findFieldById(dto.fieldId);
    if (!field) {
      throw new NotFoundException('Field not found');
    }
    await this.databaseRepo.updateField(
      {
        name: dto.name,
        type: dto.type,
        config: dto.config as any,
        position: dto.position,
      },
      dto.fieldId,
    );
    return this.databaseRepo.findFieldById(dto.fieldId);
  }

  async deleteField(fieldId: string): Promise<void> {
    await this.databaseRepo.deleteField(fieldId);
  }

  // ---- rows ----
  async listRows(databaseId: string, limit?: number): Promise<DatabaseRow[]> {
    return this.databaseRepo.listRows(databaseId, limit);
  }

  async createRow(dto: CreateRowDto, userId: string): Promise<DatabaseRow> {
    const lastPos = await this.databaseRepo.lastRowPosition(dto.databaseId);
    return this.databaseRepo.insertRow({
      databaseId: dto.databaseId,
      cells: (dto.cells ?? {}) as any,
      creatorId: userId,
      position: generateJitteredKeyBetween(lastPos, null),
    });
  }

  async updateRow(dto: UpdateRowDto): Promise<DatabaseRow> {
    const row = await this.databaseRepo.findRowById(dto.rowId);
    if (!row) {
      throw new NotFoundException('Row not found');
    }
    // merge the partial cell patch into the existing cells
    const merged = { ...(row.cells as object), ...dto.cells };
    await this.databaseRepo.updateRow({ cells: merged as any }, dto.rowId);
    return this.databaseRepo.findRowById(dto.rowId);
  }

  async deleteRow(rowId: string): Promise<void> {
    await this.databaseRepo.deleteRow(rowId);
  }

  // ---- views ----
  async createView(dto: CreateViewDto): Promise<DatabaseView> {
    const views = await this.databaseRepo.listViews(dto.databaseId);
    const last = views[views.length - 1];
    return this.databaseRepo.insertView({
      databaseId: dto.databaseId,
      name: dto.name?.trim() || 'New view',
      type: dto.type ?? 'table',
      position: generateJitteredKeyBetween(last?.position ?? null, null),
    });
  }

  async updateView(dto: UpdateViewDto): Promise<DatabaseView> {
    const view = await this.databaseRepo.findViewById(dto.viewId);
    if (!view) {
      throw new NotFoundException('View not found');
    }
    await this.databaseRepo.updateView(
      {
        name: dto.name,
        type: dto.type,
        filters: dto.filters as any,
        sorts: dto.sorts as any,
        groupBy: dto.groupBy,
        config: dto.config as any,
      },
      dto.viewId,
    );
    return this.databaseRepo.findViewById(dto.viewId);
  }

  async deleteView(viewId: string): Promise<void> {
    const view = await this.databaseRepo.findViewById(viewId);
    if (!view) {
      throw new NotFoundException('View not found');
    }
    const count = await this.databaseRepo.countViews(view.databaseId);
    if (count <= 1) {
      throw new BadRequestException('A database must have at least one view');
    }
    await this.databaseRepo.deleteView(viewId);
  }

  /** Resolve the space a row/field/view belongs to (for authorization). */
  async spaceIdForDatabase(databaseId: string): Promise<string | null> {
    const database = await this.databaseRepo.findById(databaseId);
    return database?.spaceId ?? null;
  }
}
