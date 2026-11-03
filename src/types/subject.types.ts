import type { ID, ISODateString, SearchParams } from './common.types';
import type { SubjectLack } from './lack.types';

/** Subject (asunto) as returned by GET /subject and GET /subject/:id. */
export interface Subject {
  id: ID;
  name: string;
  deleted_at: ISODateString | null;
  /** Present when relations are selected (default in buildSelectSubject). */
  lacks?: SubjectLack[];
}

/** Backend `CreateSubjectDto`. */
export interface CreateSubjectDto {
  name: string;
}

/** Backend `UpdateSubjectDto` (PartialType). */
export type UpdateSubjectDto = Partial<CreateSubjectDto>;

/** Query params of GET /subject. */
export type FilterSubjectParams = SearchParams;
