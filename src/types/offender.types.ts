import type {
  DateRangeParams,
  ID,
  ISODateString,
  Mode,
  PaginationParams,
  SearchParams,
} from './common.types';
import type { ReportHeader } from './report.types';

/** Full Prisma `Offender` model. */
export interface OffenderEntity {
  id: ID;
  name: string;
  lastname: string;
  dni: string;
  gestionate_id: number;
  subgerencia: string;
  job: string;
  regime: string;
  /** Free text from Gestionate (not the `Shift` enum). */
  shift: string;
  attendance: boolean;
  jurisdiction_id: ID | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

/** Offender as returned by GET /offender (list select). Also the report relation shape. */
export interface Offender {
  id: ID;
  name: string;
  lastname: string;
  dni: string;
  job: string;
  regime: string;
  shift: string;
  subgerencia: string;
}

/** Offender as returned by GET /offender/:id (no id selected by the backend). */
export interface OffenderDetail extends Omit<Offender, 'id'> {
  deleted_at: ISODateString | null;
}

/** `data` of GET /offender/dni/:dni (Gestionate lookup, verifyPersonal). */
export interface OffenderDniLookup {
  gestionate_id: number;
  name: string;
  lastname: string;
  dni: string;
  job: string;
  regime: string;
  shift: string;
  subgerencia: string;
  jurisdiction_id: ID | null;
  email: string | null;
}

/** Backend `CreateOffenderDto`. */
export interface CreateOffenderDto {
  name: string;
  lastname: string;
  /** 8 digits */
  dni: string;
  gestionate_id: number;
  job: string;
  shift: string;
  regime: string;
  subgerencia: string;
  attendance?: boolean;
}

/** Backend `UpdateOffenderDto` (PartialType). */
export type UpdateOffenderDto = Partial<CreateOffenderDto>;

/** Query params of GET /offender. */
export type FilterOffenderParams = SearchParams;

/** Payload built by mapFormDataToOffenderAPI (subset of CreateOffenderDto). */
export interface OffenderFormPayload {
  name: string;
  lastname: string;
  dni: string;
  job: string;
  regime: string;
  shift: string;
  attendance: boolean;
}

// ==================== Attendance ====================

/** Prisma `Attendance` model. */
export interface Attendance {
  id: ID;
  date: ISODateString | null;
  offender_id: ID;
  mode: Mode | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
  offender?: Offender;
}

/** Backend `AttendanceItemDto`. */
export interface AttendanceItemDto {
  date: string;
  mode?: Mode;
}

/** Backend `OffenderAttendanceDto`. */
export interface OffenderAttendanceDto {
  offender_id: ID;
  attendances: AttendanceItemDto[];
}

/** Backend `CreateAttendanceDto` (POST /attendance). */
export interface CreateAttendanceDto {
  items: OffenderAttendanceDto[];
}

/** Backend `UpdateAttendanceDto` (PartialType). */
export type UpdateAttendanceDto = Partial<CreateAttendanceDto>;

/** Backend `FilterAttendanceDto` (GET /attendance). */
export interface FilterAttendanceParams extends PaginationParams, DateRangeParams {
  mode?: Mode;
}

// ==================== Absence ====================

/** Prisma `Absence` model. */
export interface AbsenceEntity {
  id: ID;
  start: ISODateString;
  end: ISODateString;
  mode: Mode;
  report_id: ID;
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

/** Absence embedded in a report (select start/end/mode). */
export interface Absence {
  start: ISODateString;
  end: ISODateString;
  mode: Mode;
}

/** Backend `CreateAbsenceDto` (POST /absence). */
export interface CreateAbsenceDto {
  start: string;
  end: string;
  mode: Mode;
  header: ReportHeader;
  lack_id: ID;
  subject_id: ID;
}
