import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class PageActivityDto {
  @IsUUID()
  pageId: string;

  /** opaque keyset cursor (last seen id) */
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;
}
