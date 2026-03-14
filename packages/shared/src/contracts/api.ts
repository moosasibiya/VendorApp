export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface CursorPaginationMeta {
  limit: number;
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface CursorApiResponse<T> {
  data: T;
  meta: CursorPaginationMeta;
}

export interface ApiError {
  statusCode: number;
  message: string;
  code: string;
}
