/**
 * Shared primitives, backend enum mirrors, response envelope and pagination.
 */

// ==================== Aliases ====================

/** UUID primary key used by every backend entity. */
export type ID = string;

/** ISO-8601 date string as serialized by the API (e.g. "2025-11-09T14:30:00.000Z"). */
export type ISODateString = string;

/** Date-only string "YYYY-MM-DD" used in query params (start/end). */
export type DateOnlyString = string;

// ==================== Backend enum mirrors (Prisma) ====================

export const ACTIONS = [
  'APPROVE',
  'CREATE',
  'DELETE',
  'DOWNLOAD',
  'GET_ONE',
  'GET_ALL',
  'LOGIN',
  'LOGOUT',
  'REJECT',
  'RESTORE',
  'REVOKE',
  'SEND',
  'UPDATE',
] as const;
export type Action = (typeof ACTIONS)[number];

export const CAMS = ['BODYCAM', 'CAMERA', 'RADIO', 'PHONE'] as const;
export type Cam = (typeof CAMS)[number];

export const MODES = ['JUSTIFIED', 'UNJUSTIFIED'] as const;
export type Mode = (typeof MODES)[number];

export const MODELS = [
  'AUDIT',
  'AUTH',
  'BODYCAM',
  'JOB',
  'JURISDICTION',
  'LACK',
  'LEAD',
  'OFFENDER',
  'REPORT',
  'SESSION',
  'SUBJECT',
  'USER',
] as const;
export type Model = (typeof MODELS)[number];

export const PROCESSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type Process = (typeof PROCESSES)[number];

export const SHIFTS = ['M', 'T', 'N'] as const;
export type Shift = (typeof SHIFTS)[number];

export const STATUSES = ['BLOCKED', 'FAILED', 'SUCCESS'] as const;
export type Status = (typeof STATUSES)[number];

// ==================== Response envelope (ResponseInterceptor) ====================

/** Every non-null JSON response is wrapped as `{ message, data }`. */
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/** Body returned when the handler returns nothing (e.g. DELETE). */
export interface ApiMessageResponse {
  message: string;
}

/** NestJS error body (HttpException / ValidationPipe). */
export interface ApiErrorBody {
  message: string | string[];
  error?: string;
  statusCode: number;
}

// ==================== Pagination ====================

/** Backend `PaginatedResult<T>` metadata (common/interfaces/pagination.interface.ts). */
export interface PaginationMeta {
  currentPage: number;
  /** Number of items in the current page (NOT the page size). */
  pageCount: number;
  totalCount: number;
  totalPages: number;
}

/** Backend `PaginatedResult<T>`. */
export interface Paginated<T> extends PaginationMeta {
  data: T[];
}

/** Full HTTP body of a paginated list endpoint: `{ message, data: { data, ...meta } }`. */
export type PaginatedResponse<T> = ApiResponse<Paginated<T>>;

/** Backend `PaginationDto`. page=0 returns every row. */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Backend `SearchDto`. */
export interface SearchParams extends PaginationParams {
  search?: string;
}

/** Date range used by dashboard / attendance / report filters ("YYYY-MM-DD"). */
export interface DateRangeParams {
  start?: DateOnlyString;
  end?: DateOnlyString;
}

/** Pagination shape built on the front by getReports/getBodycams for tables. */
export interface TablePagination {
  currentPage: number;
  totalPages: number;
  perPage: number;
  total: number;
  from: number;
  to: number;
}

/** `{ data, pagination }` returned by front-side list adapters. */
export interface TableResult<T> {
  data: T[];
  pagination: TablePagination;
}

/** `{ data, found }` returned by front-side get-by-id adapters. */
export interface FoundResult<T> {
  data: T[];
  found: boolean;
}

// ==================== Generic shapes ====================

/** Soft-delete + timestamps present on most Prisma models. */
export interface Timestamps {
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

/** `{ id, name }` relation select used across many endpoints. */
export interface NamedRef {
  id: ID;
  name: string;
}

/** Option for <select> / autocomplete components. */
export interface Option<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}
