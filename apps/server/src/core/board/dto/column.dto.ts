import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateColumnDto {
  @IsUUID()
  boardId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateColumnDto {
  @IsUUID()
  columnId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class MoveColumnDto {
  @IsUUID()
  columnId: string;

  @IsString()
  position: string;
}
