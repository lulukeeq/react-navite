import { IsISO8601, IsOptional } from 'class-validator';

export class PullQueryDto {
  @IsOptional()
  @IsISO8601()
  since?: string;
}
