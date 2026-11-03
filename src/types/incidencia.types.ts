import type { ID, ISODateString, Mode } from './common.types';
import type { Absence } from './offender.types';
import type { Evidence, ReportHeader } from './report.types';

/** Media type selected in ModalIncidencia. */
export const TIPOS_MEDIO = ['bodycam', 'camara', 'radio'] as const;
export type TipoMedio = (typeof TIPOS_MEDIO)[number];

/** Media label shown in the table (api/report.ts). */
export type MedioLabel = 'Bodycam' | 'Cámara' | 'Otro';

/** Lowercased `process` or 'draft' when process is null. */
export type IncidenciaStatus = 'draft' | 'pending' | 'approved' | 'rejected';

/** Turno as shown in the form (full name) or as initial. */
export type Turno = 'Mañana' | 'Tarde' | 'Noche' | 'M' | 'T' | 'N';

/** Leaflet order: [latitude, longitude]. */
export type LatLng = [number, number];

export interface Ubicacion {
  coordinates: LatLng;
  address: string;
}

/** Ubicacion as mapped from the API, where latitude/longitude may be null. */
export interface UbicacionNullable {
  coordinates: [number | null, number | null];
  address: string;
}

/** Form state of ModalIncidencia (`defaultState`). */
export interface IncidenciaForm {
  dni: string;
  nombreCompleto: string;
  asunto: string;
  falta: string;
  turno: string;
  medio: string;
  tipoMedio: TipoMedio;
  /** "YYYY-MM-DD" */
  fechaIncidente: string;
  /** "HH:mm" */
  horaIncidente: string;
  bodycamNumber: string;
  bodycamAsignadaA: string;
  bodycamId?: ID | null;
  numeroCamara: string;
  numeroRadio: string;
  ubicacion: Ubicacion | null;
  jurisdiccion: string;
  jurisdictionId: ID | null;
  /** Job (cargo) of the main recipient. */
  dirigidoA: string;
  /** Name of the main recipient. */
  destinatario: string;
  cargoDestinatario: string;
  cargo: string;
  regLab: string;
  fechaFalta: string;
  conCopia: boolean;
  /** Full names of CC leads. */
  cc: string[];
  subjectId: ID | null;
  lackId: ID | null;
  tipoInasistencia?: string | null;
}

/** Row model produced by getReports/getReportById and consumed by IncidenciasPage/ModalPDFInforme. */
export interface Incidencia {
  id: ID;
  code: string | null;
  dni: string;
  asunto: string;
  falta: string;
  tipoInasistencia: string | null;
  medio: MedioLabel;
  tipoMedio: TipoMedio;
  numeroCamara: string;
  /** "DD/MM/YYYY" */
  fechaIncidente: string;
  /** "HH:mm" */
  horaIncidente: string;
  turno: string;
  cargo: string;
  regLab: string;
  subgerencia: string;
  jurisdiccion: string;
  jurisdictionId: ID | null;
  bodycamNumber: string;
  bodycamAsignadaA: string;
  encargadoBodycam: string;
  registradoPor: string;
  dirigidoA: string;
  destinatario: string;
  cargoDestinatario: string;
  cc: string[];
  ubicacion: UbicacionNullable;
  nombreCompleto: string;
  status: IncidenciaStatus;
  evidences: Evidence[];
  message: string;
  link: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt: ISODateString | null;
  isAbsenceReport: boolean;
  absences: Absence[];
  absenceStart: ISODateString | null;
  absenceEnd: ISODateString | null;
  absenceMode: Mode | null;
}

/** Legacy localStorage model (utils/storage.ts loadIncidencias). */
export interface StoredIncidencia {
  id: ID;
  dni: string;
  asunto: string;
  falta: string;
  turno: string;
  medio: string;
  fechaIncidente: string;
  horaIncidente: string;
  bodycamNumber: string;
  ubicacion: { coordinates: LatLng | null; address: string } | null;
  dirigidoA: string;
  destinatario: string;
  conCopia: boolean;
  cc: string[];
  createdAt: string;
  updatedAt: string;
  jurisdiccion: string;
  cargo: string;
  regLab: string;
  bodycamAsignadaA: string;
  encargadoBodycam: string;
  tipoInasistencia: string;
  fechaFalta: string;
}

/**
 * Payload produced by mapFormDataToAPI before POST /report.
 * Looser than CreateReportDto: values may be null and `camera_number`
 * is a front-only field not declared in the backend DTO.
 */
export interface ReportFormPayload {
  header: ReportHeader;
  address: string;
  latitude: number | null;
  longitude: number | null;
  date: ISODateString;
  offender_dni: string;
  lack_id: ID | null;
  subject_id: ID | null;
  jurisdiction_id: ID | null;
  bodycam_id?: ID;
  bodycam_dni?: string;
  camera_number?: string;
}
