import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export function paginate<T>(
  items: T[],
  total: number,
  dto: PaginationDto,
): PaginatedResponse<T> {
  return {
    items,
    total,
    page: dto.page,
    limit: dto.limit,
    totalPages: Math.ceil(total / dto.limit),
    hasNextPage: dto.page * dto.limit < total,
  };
}
