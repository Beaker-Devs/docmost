import { IsString, IsUUID } from 'class-validator';

export class BoardIdDto {
  @IsUUID()
  boardId: string;
}

export class SpaceIdDto {
  @IsUUID()
  spaceId: string;
}

export class ColumnIdDto {
  @IsUUID()
  columnId: string;
}

export class CardIdDto {
  @IsUUID()
  cardId: string;
}
