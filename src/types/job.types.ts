import type { ID, ISODateString, SearchParams } from './common.types';

/** Job (cargo) as returned by GET /job and GET /job/:id. */
export interface Job {
  id: ID;
  name: string;
  deleted_at: ISODateString | null;
}

/** Backend `CreateJobDto`. */
export interface CreateJobDto {
  name: string;
}

/** Backend `UpdateJobDto` (PartialType). Sent with PUT /job/:id. */
export type UpdateJobDto = Partial<CreateJobDto>;

/** Query params of GET /job. */
export type FilterJobParams = SearchParams;
