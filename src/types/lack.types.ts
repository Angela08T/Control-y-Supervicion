import type { ID, ISODateString, NamedRef, SearchParams } from './common.types';

/** Lack (falta) as returned by GET /lack (buildSelectLack relations). */
export interface Lack {
  id: ID;
  article: string | null;
  attendance: boolean;
  content: string;
  description: string | null;
  name: string;
  deleted_at: ISODateString | null;
  /** Present when relations are selected. */
  subject?: NamedRef;
  /** Present when ids are selected. */
  subject_id?: ID;
}

/** Lack summary embedded in a subject (GET /subject/:id). */
export interface SubjectLack {
  id: ID;
  attendance: boolean;
  name: string;
  deleted_at: ISODateString | null;
}

/** Backend `CreateLackDto`. */
export interface CreateLackDto {
  article?: string;
  content: string;
  description?: string;
  name: string;
  subject_id: ID;
}

/** Backend `UpdateLackDto` (PartialType). */
export type UpdateLackDto = Partial<CreateLackDto>;

/** Query params of GET /lack. */
export type FilterLackParams = SearchParams;
