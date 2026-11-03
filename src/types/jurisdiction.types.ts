import type { ID, ISODateString, SearchParams } from './common.types';

/** Jurisdiction as returned by GET /jurisdiction and GET /jurisdiction/:id. */
export interface Jurisdiction {
  id: ID;
  name: string;
  deleted_at: ISODateString | null;
}

/** Full Prisma `Jurisdiction` model. */
export interface JurisdictionEntity extends Jurisdiction {
  gestionate_id: number | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/** Backend `CreateJurisdictionDto`. */
export interface CreateJurisdictionDto {
  name: string;
}

/** Backend `UpdateJurisdictionDto` (PartialType). */
export type UpdateJurisdictionDto = Partial<CreateJurisdictionDto>;

/** Query params of GET /jurisdiction. */
export type FilterJurisdictionParams = SearchParams;

// ==================== Local GeoJSON (/Data/juridiccion.geojson) ====================

/** [longitude, latitude] position (GeoJSON / Turf order). */
export type GeoPosition = [number, number];

export interface JurisdictionPolygonGeometry {
  type?: 'Polygon';
  coordinates: GeoPosition[][];
}

/** Item of `data` in the local jurisdiction GeoJSON file. */
export interface JurisdictionGeo {
  id: ID | number;
  name: string;
  description?: string;
  color?: string;
  geometry?: JurisdictionPolygonGeometry;
}

/** Root of the local jurisdiction GeoJSON file. */
export interface JurisdictionGeoFile {
  status: boolean;
  data: JurisdictionGeo[];
}

/** Result of useJurisdiccionDetection().detectarJurisdiccion. */
export interface DetectedJurisdiction {
  id: JurisdictionGeo['id'];
  name: string;
  description?: string;
  color?: string;
}

/** Result of useJurisdiccionDetection().obtenerJurisdiccionActual. */
export interface CurrentJurisdictionResult {
  coordinates: { latitude: number; longitude: number };
  jurisdiccion: DetectedJurisdiction | null;
}
