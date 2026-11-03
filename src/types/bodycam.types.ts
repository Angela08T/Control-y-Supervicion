import type { Cam, ID, ISODateString, SearchParams } from './common.types';

/** Bodycam as returned by GET /bodycam and GET /bodycam/:id. */
export interface Bodycam {
  id: ID;
  name: string;
  serie: string | null;
  cam: Cam;
  deleted_at: ISODateString | null;
}

/** Bodycam after the front adapter in api/bodycam.ts (`cam || null`). */
export interface BodycamView {
  id: ID;
  name: string;
  serie: string | null;
  cam: Cam | null;
  deleted_at: ISODateString | null;
}

/** Bodycam relation embedded in a report. */
export interface ReportBodycam {
  id: ID;
  name: string;
  cam: Cam;
}

/** Backend `CreateBodycamDto`. */
export interface CreateBodycamDto {
  name: string;
  serie?: string;
  cam: Cam;
}

/** Backend `UpdateBodycamDto` (PartialType). */
export type UpdateBodycamDto = Partial<CreateBodycamDto>;

/** Backend `FilterBodycamDto`. */
export interface FilterBodycamParams extends SearchParams {
  cam?: Cam;
}
