import type { Role } from './auth.types';
import type { ApiResponse, DateOnlyString, ID } from './common.types';

/** Backend `FilterDashboardDto` (start and end are required by the service). */
export interface DashboardRangeParams {
  start: DateOnlyString;
  end: DateOnlyString;
  subject?: ID;
  page?: number;
  limit?: number;
}

/** Sent/approved counter. */
export interface SentApproved {
  sent: number;
  approved: number;
}

/** Subject / jurisdiction ranking item of /dashboard/general. */
export interface DashboardRankItem extends SentApproved {
  id: ID;
  name: string;
}

/** `data` of GET /dashboard/general. */
export interface DashboardGeneral {
  total: number;
  /** shift M */
  morning: number;
  /** shift T */
  afternoon: number;
  /** shift N */
  evening: number;
  top_subject: DashboardRankItem | null;
  top_jurisdiction: DashboardRankItem | null;
}

/** One day of /dashboard/trends. `subjects` is keyed by subject id plus the key "others". */
export interface TrendDay extends SentApproved {
  /** "YYYY-MM-DD" */
  date: DateOnlyString;
  subjects: Record<string, SentApproved>;
}

/** `data` of GET /dashboard/trends. */
export interface DashboardTrends extends SentApproved {
  days: TrendDay[];
}

/** Report counters grouped by process. draft = process null. */
export interface ProcessCounters {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
}

/** Per-user row of /dashboard/performance. */
export interface UserPerformance extends ProcessCounters {
  id: ID;
  name: string;
  lastname: string;
  rol: Role;
}

/** `data` of GET /dashboard/performance. */
export interface DashboardPerformance {
  general: ProcessCounters;
  performance: UserPerformance[];
}

export interface LackCount {
  lack: string;
  count: number;
}

/** Per-offender row of /dashboard/offenders. */
export interface OffenderMetric {
  id: ID;
  name: string;
  lastname: string;
  dni: string;
  subgerencia: string;
  job: string;
  total: number;
  byLack: LackCount[];
}

/** `data` of GET /dashboard/offenders. */
export interface DashboardOffenders {
  general: { totalReports: number; totalOffenders: number };
  performance: OffenderMetric[];
}

export type DashboardGeneralResponse = ApiResponse<DashboardGeneral>;
export type DashboardTrendsResponse = ApiResponse<DashboardTrends>;
export type DashboardPerformanceResponse = ApiResponse<DashboardPerformance>;
export type DashboardOffendersResponse = ApiResponse<DashboardOffenders>;

/**
 * GET /statistics/dashboard, /statistics/field-supervision and /personnel/active
 * have no backend implementation; their shape is unknown.
 */
export type LegacyStatisticsResponse = unknown;

/** Return value of utils/storage.ts getPDFDownloadStats. */
export interface PDFDownloadStats {
  totalIncidencias: number;
  totalDownloads: number;
  percentage: number;
}

/** Item stored by utils/storage.ts trackPDFDownload. */
export interface PDFDownloadRecord {
  incidenciaId: ID;
  timestamp: string;
}
