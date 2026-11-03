import type { ReportBodycam } from './bodycam.types';
import type {
  ID,
  ISODateString,
  NamedRef,
  Process,
  SearchParams,
  Shift,
} from './common.types';
import type { Absence, Offender } from './offender.types';
import type { ReportUser } from './user.types';

/** Backend `RecipientDto`. */
export interface Recipient {
  name: string;
  job: string;
}

/** Backend `HeaderDto` (stored as Json in Report.header). cc requires at least 1 item. */
export interface ReportHeader {
  to: Recipient;
  cc: Recipient[];
}

/** Prisma `Evidence` model as returned inside a report. */
export interface Evidence {
  id: ID;
  description: string;
  path: string;
  mimetype: string;
  size: number;
  report_id: ID;
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

/** Evidence after the front adapter in getReportWithEvidences. */
export interface EvidenceView {
  id: ID;
  description: string;
  path: string;
  imageUrl: string;
  mimetype: string;
  size: number;
  createdAt: ISODateString;
}

/** Report as returned by GET /report and GET /report/:id (buildSelectReport relations). */
export interface Report {
  id: ID;
  address: string | null;
  code: string | null;
  date: ISODateString;
  bodycam_user: string | null;
  bodycam_supervisor: string | null;
  header: ReportHeader;
  latitude: number | null;
  longitude: number | null;
  /** Links separated by "\n". */
  link: string | null;
  message: string | null;
  /** null = draft (not sent to validator yet). */
  process: Process | null;
  shift: Shift | null;
  evidences: Evidence[];
  deleted_at: ISODateString | null;
  absences: Absence[];
  bodycam: ReportBodycam | null;
  jurisdiction: NamedRef | null;
  lack: NamedRef;
  offender: Offender | null;
  subject: NamedRef;
  user: ReportUser;
  /** Present only when ids are selected. */
  bodycam_id?: ID | null;
  jurisdiction_id?: ID | null;
  lack_id?: ID;
  offender_id?: ID | null;
  subject_id?: ID;
  user_id?: ID;
}

/** Report returned by getReportWithEvidences (evidences mapped, message defaulted). */
export interface ReportWithEvidences extends Omit<Report, 'evidences' | 'message'> {
  evidences: EvidenceView[];
  message: string;
}

/** Backend `CreateReportDto` (POST /report). */
export interface CreateReportDto {
  address: string;
  header: ReportHeader;
  /** ISO date string */
  date: ISODateString;
  latitude: number;
  longitude: number;
  /** 8 digits */
  bodycam_dni?: string;
  bodycam_supervisor?: string;
  /** 8 digits */
  offender_dni: string;
  bodycam_id?: ID;
  jurisdiction_id: ID;
  lack_id: ID;
  subject_id: ID;
}

/** Backend `UpdateReportDto` (PartialType + link/message). Sent as multipart in PATCH /report/:id. */
export interface UpdateReportDto extends Partial<CreateReportDto> {
  link?: string;
  message?: string;
}

/** Arguments of api/report.ts updateReportWithEvidences (multipart form). */
export interface UpdateReportEvidencesInput {
  files: File[];
  descriptions: string[];
  message?: string;
  link?: string;
}

/** Body of PATCH /report/:id/validate. */
export interface ValidateReportDto {
  approved: boolean;
}

/** Backend `FilterReportDto` (GET /report, GET /report/export). */
export interface FilterReportParams extends SearchParams {
  jurisdiction?: ID;
  lack?: ID;
  process?: Process;
  subject?: ID;
  shift?: Shift;
  subgerencia?: string;
  start?: string;
  end?: string;
}

/** Filters object used by IncidenciasPage and passed to getReports/exportReportsExcel. */
export interface ReportFilters {
  lackId?: ID | null;
  subjectId?: ID | null;
  jurisdictionId?: ID | null;
  shift?: Shift | '';
  process?: Process | '';
  subgerencia?: string;
  search?: string;
}
