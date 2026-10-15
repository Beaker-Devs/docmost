import {
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCardDto {
  @IsUUID()
  boardId: string;

  @IsUUID()
  columnId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCardDto {
  @IsUUID()
  cardId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @IsOptional()
  @IsISO8601()
  dueDate?: string | null;

  @IsOptional()
  @IsArray()
  labels?: string[];
}

export class MoveCardDto {
  @IsUUID()
  cardId: string;

  @IsUUID()
  columnId: string;

  @IsString()
  position: string;
}

export class CreateCardPageDto {
  @IsUUID()
  cardId: string;

  @IsOptional()
  @IsUUID()
  parentPageId?: string;

  // when set, a new folder page with this title is created (optionally under
  // parentPageId) and the card's page is nested inside it
  @IsOptional()
  @IsString()
  newParentTitle?: string;
}
