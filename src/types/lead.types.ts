import type { ID, ISODateString, NamedRef, SearchParams } from './common.types';

/** Lead (personal / destinatario) as returned by GET /lead (buildLeadSelect relations). */
export interface Lead {
  id: ID;
  name: string;
  lastname: string;
  deleted_at: ISODateString | null;
  /** Present when the endpoint selects relations. */
  job?: NamedRef;
  /** Present when the endpoint selects ids. */
  job_id?: ID;
}

/** Backend `CreateLeadDto`. */
export interface CreateLeadDto {
  /** 3-25 chars */
  name: string;
  /** 3-25 chars */
  lastname: string;
  job_id: ID;
}

/** Backend `UpdateLeadDto` (PartialType). */
export type UpdateLeadDto = Partial<CreateLeadDto>;

/** Backend `FilterLeadDto`. */
export interface FilterLeadParams extends SearchParams {
  /** job id */
  job?: ID;
}
