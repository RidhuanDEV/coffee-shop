export interface ApiResponse<T> {
  data: T;
  success: boolean;
  meta?: PaginationMeta;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: { path: string; message: string }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface FilterParams {
  [key: string]: string | number | boolean | undefined;
}

export type QueryParams = PaginationParams & Partial<SortParams> & FilterParams;
