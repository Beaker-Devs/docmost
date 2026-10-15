import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateBoardDto {
  @IsUUID()
  boardId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
