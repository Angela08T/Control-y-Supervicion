import type { Role } from './auth.types';
import type { ID, ISODateString, SearchParams } from './common.types';

/** Full Prisma `User` model (password omitted, never sent to the client). */
export interface UserEntity {
  id: ID;
  username: string;
  name: string;
  lastname: string;
  email: string;
  dni: string | null;
  phone: string | null;
  max_ips: number;
  rol: Role;
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

/** User as returned by GET /user and GET /user/:id (buildSelectUser). */
export interface User {
  id: ID;
  name: string;
  lastname: string;
  username: string;
  email: string;
  dni: string | null;
  phone: string | null;
  rol: Role;
  deleted_at: ISODateString | null;
}

/** User relation embedded in a report. */
export interface ReportUser {
  id: ID;
  username: string;
  name: string;
  lastname: string;
  email: string;
  dni: string | null;
  phone: string | null;
}

/** Backend `CreateUserDto`. */
export interface CreateUserDto {
  username: string;
  /** 8-20 chars, upper, lower, digit and one of $ % & # */
  password: string;
  name: string;
  lastname: string;
  email: string;
  /** 8 digits */
  dni?: string;
  /** 9 digits */
  phone?: string;
  rol: Role;
}

/** Backend `UpdateUserDto` (PartialType). */
export type UpdateUserDto = Partial<CreateUserDto>;

/** Backend `FilterUserDto`. */
export interface FilterUserParams extends SearchParams {
  rol?: Role;
}

/** Backend `DeactivateSessionDto` (POST /session/deactivate). */
export interface DeactivateSessionDto {
  user_id: ID;
  ip: string;
}
