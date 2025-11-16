// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  CENTINELA: 'centinela',
  VALIDATOR: 'validator'
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// localStorage Keys
export const STORAGE_KEYS = {
  CENTINELA_THEME: 'centinela-theme',
  CENTINELA_INCIDENCIAS: 'centinela_incidencias_v2',
  PERSIST_ROOT: 'persist:root'
};

// Incident Types
export const INCIDENT_TYPES = {
  FALTA_DISCIPLINARIA: 'Falta disciplinaria',
  ABANDONO_SERVICIO: 'Abandono de servicio',
  INASISTENCIA: 'Inasistencia'
};

// Shifts
export const SHIFTS = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
  NIGHT: 'Noche'
};

// Evidence Sources
export const EVIDENCE_SOURCES = {
  BODYCAM: 'bodycam',
  REPORT: 'reporte'
};
