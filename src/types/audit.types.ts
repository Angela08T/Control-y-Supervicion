import type { Action, ID, ISODateString, Model, SearchParams, Status } from './common.types';

/** Audit row as returned by GET /audit (buildAuditSelect). */
export interface Audit {
  id: ID;
  ip: string;
  action: Action;
  model: Model;
  status: Status;
  description: string;
  register_id: string | null;
  field: string | null;
  preview_content: string | null;
  new_content: string | null;
  user: { id: ID; username: string } | null;
  created_at: ISODateString;
}

/** Backend `CreateAuditDto` (server-side only, kept for completeness). */
export interface CreateAuditDto {
  ip: string;
  description: string;
  register_id?: string | null;
  action: Action;
  model: Model;
  status: Status;
  field?: string;
  preview_content?: string;
  new_content?: string;
  user_id?: ID;
}

/** Backend `FilterAuditDto`. */
export interface FilterAuditParams extends SearchParams {
  action?: Action;
  model?: Model;
  status?: Status;
  /** user id */
  user?: ID;
}

/** Filters object accepted by api/audit.ts getAllAudits (page/limit passed apart). */
export type AuditFilters = Omit<FilterAuditParams, 'page' | 'limit'>;
