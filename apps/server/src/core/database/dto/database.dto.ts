import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export const FIELD_TYPES = [
  'text',
  'number',
  'select',
  'multi_select',
  'date',
  'checkbox',
  'user',
  'url',
] as const;

export const VIEW_TYPES = ['table', 'board'] as const;

export class SpaceIdDto {
  @IsUUID()
  spaceId: string;
}

export class DatabaseIdDto {
  @IsUUID()
  databaseId: string;
}

export class CreateDatabaseDto {
  @IsUUID()
  spaceId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateDatabaseDto {
  @IsUUID()
  databaseId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class CreateFieldDto {
  @IsUUID()
  databaseId: string;

  @IsString()
  name: string;

  @IsIn(FIELD_TYPES)
  type: (typeof FIELD_TYPES)[number];

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class UpdateFieldDto {
  @IsUUID()
  fieldId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(FIELD_TYPES)
  type?: (typeof FIELD_TYPES)[number];

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsString()
  position?: string;
}

export class FieldIdDto {
  @IsUUID()
  fieldId: string;
}

export class ListRowsDto {
  @IsUUID()
  databaseId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  limit?: number = 1000;
}

export class CreateRowDto {
  @IsUUID()
  databaseId: string;

  @IsOptional()
  @IsObject()
  cells?: Record<string, any>;
}

export class UpdateRowDto {
  @IsUUID()
  rowId: string;

  // partial map of fieldId -> value; merged into the existing cells
  @IsObject()
  cells: Record<string, any>;
}

export class RowIdDto {
  @IsUUID()
  rowId: string;
}

export class CreateViewDto {
  @IsUUID()
  databaseId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(VIEW_TYPES)
  type?: (typeof VIEW_TYPES)[number];
}

export class UpdateViewDto {
  @IsUUID()
  viewId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(VIEW_TYPES)
  type?: (typeof VIEW_TYPES)[number];

  @IsOptional()
  @IsArray()
  filters?: any[];

  @IsOptional()
  @IsArray()
  sorts?: any[];

  @IsOptional()
  @IsUUID()
  groupBy?: string | null;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class ViewIdDto {
  @IsUUID()
  viewId: string;
}
